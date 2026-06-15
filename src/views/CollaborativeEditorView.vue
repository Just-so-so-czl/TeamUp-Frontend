<script setup lang="ts">
import { computed, onBeforeUnmount, ref, type Component } from 'vue'
import { Extension } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { defaultSelectionBuilder, yCursorPlugin } from '@tiptap/y-tiptap'
import { Table } from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import { TextStyle } from '@tiptap/extension-text-style'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { HocuspocusProvider } from '@hocuspocus/provider'
import * as Y from 'yjs'
import {
  ArrowLeft,
  Bold,
  Bot,
  ChevronDown,
  ChevronsRight,
  Code2,
  Copy,
  Ellipsis,
  Highlighter,
  Image,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Plus,
  Redo2,
  Send,
  SquareCode,
  Strikethrough,
  Table2,
  ThumbsDown,
  ThumbsUp,
  Type,
  Underline as UnderlineIcon,
  Undo2,
  User,
  WandSparkles,
} from 'lucide-vue-next'
import avatar1 from '@/assets/avatar/a1.png'
import avatar2 from '@/assets/avatar/a2.png'
import avatar3 from '@/assets/avatar/a3.png'
import avatar4 from '@/assets/avatar/a4.png'
import avatar5 from '@/assets/avatar/a5.png'
import avatar6 from '@/assets/avatar/a6.png'
import avatar7 from '@/assets/avatar/a7.png'
import avatar8 from '@/assets/avatar/a8.png'
import { getStoredLoginUser } from '@/utils/authUser'

interface MemberItem {
  id: string
  name: string
  role?: string
  avatar: string
  active?: boolean
}

interface ChatMessage {
  id: string
  side: 'left' | 'right'
  time: string
  avatar?: string
  title?: string
  text?: string
  html?: string
}

interface ToolbarItem {
  icon?: Component
  text?: string
  textValue?: string
  action?: () => void
  label: string
  active?: () => boolean | undefined
  accent?: boolean
  colorPreview?: string
}

interface AwarenessUserState {
  id?: string
  name?: string
  avatar?: string
}

interface AwarenessStateShape {
  user?: AwarenessUserState
}

interface CollaborationCursorUser {
  id?: string
  name: string
  color: string
  avatar?: string
}

interface CollaborationCursorOptions {
  provider: HocuspocusProvider | null
  user: CollaborationCursorUser
  render: (user: CollaborationCursorUser) => HTMLElement
  selectionRender: typeof defaultSelectionBuilder
}

const route = useRoute()
const router = useRouter()

const documentTitle = computed(() => String(route.query.title || '产品需求文档'))
const documentId = computed(() => String(route.params.documentId || ''))
const hocuspocusUrl = import.meta.env.VITE_HOCUSPOCUS_URL || 'ws://127.0.0.1:1234'
const collaborationRoomName = computed(() => documentId.value || 'preview-collab-doc')

const avatarMap: Record<number, string> = {
  1: avatar1,
  2: avatar2,
  3: avatar3,
  4: avatar4,
  5: avatar5,
  6: avatar6,
  7: avatar7,
  8: avatar8,
}

const defaultOnlineMembers: MemberItem[] = [
  { id: '1', name: '张三', role: '所有者', avatar: avatar1, active: true },
  { id: '2', name: '李四', avatar: avatar2, active: true },
  { id: '3', name: '王五', avatar: avatar3, active: true },
  { id: '4', name: '赵六', avatar: avatar4, active: false },
  { id: '5', name: '孙七', avatar: avatar5, active: true },
  { id: '6', name: '周八', avatar: avatar6, active: true },
]

const collaborationMembers = ref<MemberItem[]>([])
const connectionStatus = ref<'connecting' | 'connected' | 'disconnected'>('connecting')
const documentSynced = ref(false)

const aiMessages: ChatMessage[] = [
  {
    id: 'welcome',
    side: 'left',
    time: '',
    title: '你好，我是你的文档助手',
    text: '我可以帮你总结内容、回答问题、优化文案等。',
  },
  {
    id: 'q1',
    side: 'right',
    time: '10:30',
    avatar: avatar1,
    text: '请帮我总结一下本文档的核心需求',
  },
  {
    id: 'a1',
    side: 'left',
    time: '10:31',
    html: `
      <p>好的，以下是本文档的核心需求：</p>
      <ul>
        <li>支持多人在线协作编辑文档</li>
        <li>实时保存与版本管理</li>
        <li>提供评论与 @ 成员功能</li>
        <li>集成 AI 助手，支持问答、摘要和续写</li>
      </ul>
    `,
  },
]

const quickActions = ['帮我优化这段文字', '提取本文档的待办事项']
const textColor = '#e05f54'
const highlightColor = '#fff1a8'
const fontSizeOptions = ['12', '14', '16', '18', '20', '24']
const selectedFontSize = ref('14')
const tableDialogVisible = ref(false)
const tableRowsInput = ref(3)
const tableColsInput = ref(3)
const zoomPercent = ref(100)
const currentUser = getStoredLoginUser()

const currentUserProfile = {
  id: currentUser?.id || 'local-user',
  name: currentUser?.name || '当前用户',
  avatar: avatarMap[currentUser?.avatar || 1] || avatar1,
  color: ['#2f7fff', '#ef6c5b', '#26a69a', '#8e6cf4', '#ff9f43', '#20bf6b'][Number(currentUser?.avatar || 1) % 6] || '#2f7fff',
}

const COLLAB_LOG_PREFIX = '[collab-editor]'
const providerLogState = {
  incomingMessages: 0,
  outgoingMessages: 0,
  awarenessUpdates: 0,
  ydocUpdates: 0,
  editorUpdates: 0,
}

function logCollab(message: string, payload?: Record<string, unknown>) {
  if (payload) {
    console.info(COLLAB_LOG_PREFIX, message, payload)
    return
  }
  console.info(COLLAB_LOG_PREFIX, message)
}

function warnCollab(message: string, payload?: Record<string, unknown>) {
  if (payload) {
    console.warn(COLLAB_LOG_PREFIX, message, payload)
    return
  }
  console.warn(COLLAB_LOG_PREFIX, message)
}

function summarizeCloseEvent(event: unknown) {
  const closeEvent = event as { code?: number; reason?: string; wasClean?: boolean } | undefined
  return {
    code: closeEvent?.code,
    reason: closeEvent?.reason,
    wasClean: closeEvent?.wasClean,
  }
}

const FontSizeExtension = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {}
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },
})

const CollaborationCursor = Extension.create<CollaborationCursorOptions>({
  name: 'collaborationCursor',
  addOptions() {
    return {
      provider: null,
      user: {
        name: '协作者',
        color: '#2f7fff',
      },
      render: renderCursor,
      selectionRender: defaultSelectionBuilder,
    }
  },
  addStorage() {
    return {
      users: [],
    }
  },
  addProseMirrorPlugins() {
    if (!this.options.provider?.awareness) {
      warnCollab('collaboration cursor skipped: missing provider awareness', {
        roomName: collaborationRoomName.value,
      })
      return []
    }

    const awareness = this.options.provider.awareness
    awareness.setLocalStateField('user', this.options.user)
    this.storage.users = Array.from(awareness.getStates().entries()).map(([clientId, state]) => ({
      clientId,
      ...(state.user || {}),
    }))
    awareness.on('update', () => {
      this.storage.users = Array.from(awareness.getStates().entries()).map(([clientId, state]) => ({
        clientId,
        ...(state.user || {}),
      }))
    })

    return [
      yCursorPlugin(awareness, {
        cursorBuilder: this.options.render,
        selectionBuilder: this.options.selectionRender,
      }),
    ]
  },
})

const ydoc = new Y.Doc()

logCollab('页面初始化', {
  teamId: String(route.params.id || ''),
  documentId: documentId.value,
  roomName: collaborationRoomName.value,
  hocuspocusUrl,
  ydocClientId: ydoc.clientID,
  userId: currentUserProfile.id,
})

/**
 * 这里显式创建 Y.UndoManager，而不是继续依赖 Tiptap 默认 history。
 * 原因是协同编辑场景下，真正的文档来源是 Y.js 的 CRDT 状态，
 * 撤销/重做也必须由 Y.js 统一管理，才能避免多人协作时的历史栈错乱。
 */
const undoManager = new Y.UndoManager(ydoc.getXmlFragment('default'))

function handleYdocUpdate(update: Uint8Array, origin: unknown) {
  providerLogState.ydocUpdates += 1
  if (providerLogState.ydocUpdates <= 10 || providerLogState.ydocUpdates % 20 === 0) {
    logCollab('Y.Doc update', {
      count: providerLogState.ydocUpdates,
      updateBytes: update.byteLength,
      originType: origin?.constructor?.name || typeof origin,
    })
  }
}

ydoc.on('update', handleYdocUpdate)

function syncPresenceMembers() {
  const awarenessStates = provider.awareness?.getStates() as Map<number, AwarenessStateShape> | undefined
  if (!awarenessStates || awarenessStates.size === 0) {
    collaborationMembers.value = []
    return
  }

  const members = Array.from(awarenessStates.entries()).reduce<MemberItem[]>((result, [clientId, state]) => {
    const userState = state?.user
    if (!userState?.name) {
      return result
    }
    result.push({
      id: String(userState.id || clientId),
      name: String(userState.name),
      role: userState.id === currentUserProfile.id ? '我' : undefined,
      avatar: String(userState.avatar || avatar1),
      active: true,
    })
    return result
  }, [])

  collaborationMembers.value = members
}

function handleProviderStatus(event: { status: 'connecting' | 'connected' | 'disconnected' }) {
  connectionStatus.value = event.status
  logCollab('provider status', {
    status: event.status,
    roomName: collaborationRoomName.value,
    synced: provider.synced,
    hasUnsyncedChanges: provider.hasUnsyncedChanges,
  })
}

function handleProviderSynced(event: { state?: boolean }) {
  documentSynced.value = true
  logCollab('provider synced', {
    state: event?.state,
    roomName: collaborationRoomName.value,
    awarenessSize: provider.awareness?.getStates().size ?? 0,
  })
  syncPresenceMembers()
}

function handleProviderAwarenessUpdate(event: { states?: unknown[] }) {
  providerLogState.awarenessUpdates += 1
  if (providerLogState.awarenessUpdates <= 10 || providerLogState.awarenessUpdates % 20 === 0) {
    logCollab('awareness update', {
      count: providerLogState.awarenessUpdates,
      statesFromEvent: event?.states?.length ?? 0,
      statesFromProvider: provider.awareness?.getStates().size ?? 0,
    })
  }
  syncPresenceMembers()
}

function handleProviderDisconnect(event: { event?: unknown }) {
  documentSynced.value = false
  warnCollab('provider disconnect', {
    ...summarizeCloseEvent(event?.event),
    roomName: collaborationRoomName.value,
  })
}

function handleProviderClose(event: { event?: unknown }) {
  warnCollab('provider close', {
    ...summarizeCloseEvent(event?.event),
    roomName: collaborationRoomName.value,
  })
}

function handleProviderOpen() {
  logCollab('websocket open', {
    roomName: collaborationRoomName.value,
    url: hocuspocusUrl,
  })
}

function handleProviderConnect() {
  logCollab('websocket connected', {
    roomName: collaborationRoomName.value,
  })
}

function handleProviderAuthenticated(event: { scope?: string }) {
  logCollab('provider authenticated', {
    scope: event?.scope,
    roomName: collaborationRoomName.value,
  })
}

function handleProviderAuthenticationFailed(event: { reason?: string }) {
  warnCollab('provider authentication failed', {
    reason: event?.reason,
    roomName: collaborationRoomName.value,
  })
}

function handleProviderUnsyncedChanges(event: { number?: number }) {
  logCollab('provider unsynced changes', {
    number: event?.number,
    roomName: collaborationRoomName.value,
  })
}

function handleProviderIncomingMessage() {
  providerLogState.incomingMessages += 1
  if (providerLogState.incomingMessages <= 10 || providerLogState.incomingMessages % 20 === 0) {
    logCollab('provider incoming message', {
      count: providerLogState.incomingMessages,
      roomName: collaborationRoomName.value,
      synced: provider.synced,
    })
  }
}

function handleProviderOutgoingMessage(event: { message?: { type?: number; description?: string } }) {
  providerLogState.outgoingMessages += 1
  if (providerLogState.outgoingMessages <= 10 || providerLogState.outgoingMessages % 20 === 0) {
    logCollab('provider outgoing message', {
      count: providerLogState.outgoingMessages,
      type: event?.message?.type,
      description: event?.message?.description,
      roomName: collaborationRoomName.value,
    })
  }
}

/**
 * provider 负责把本地 Y.Doc 通过 WebSocket 同步到 Hocuspocus。
 * name 就是房间名，也就是本题要求的 docId。
 * 这里最关键的只有 url、name、document 三项：
 * - url: Hocuspocus 网关地址
 * - name: 房间名，也就是 docId
 * - document: 当前本地 Y.Doc
 */
const provider = new HocuspocusProvider({
  url: hocuspocusUrl,
  name: collaborationRoomName.value,
  document: ydoc,
  onOpen: handleProviderOpen,
  onConnect: handleProviderConnect,
  onStatus: handleProviderStatus,
  onSynced: handleProviderSynced,
  onAwarenessUpdate: handleProviderAwarenessUpdate,
  onDisconnect: handleProviderDisconnect,
  onClose: handleProviderClose,
  onAuthenticated: handleProviderAuthenticated,
  onAuthenticationFailed: handleProviderAuthenticationFailed,
  onUnsyncedChanges: handleProviderUnsyncedChanges,
  onMessage: handleProviderIncomingMessage,
  onOutgoingMessage: handleProviderOutgoingMessage,
})

logCollab('provider created', {
  roomName: collaborationRoomName.value,
  effectiveName: provider.effectiveName,
  manageSocket: provider.manageSocket,
  isAttached: provider.isAttached,
})

function renderCursor(user: { name: string; color: string }) {
  const cursor = document.createElement('span')
  cursor.classList.add('collaboration-cursor__caret')
  cursor.style.borderColor = user.color

  const label = document.createElement('span')
  label.classList.add('collaboration-cursor__label')
  label.style.backgroundColor = user.color
  label.textContent = user.name

  cursor.appendChild(label)
  return cursor
}

const editor = useEditor({
  extensions: [
    /**
     * 协同模式下必须禁用 StarterKit 自带 history。
     * 否则本地历史栈会和 Y.js 的协同历史互相打架，出现撤销错乱。
     */
    StarterKit.configure({
      undoRedo: false,
      link: false,
      underline: false,
    }),
    /**
     * Collaboration 把当前编辑器绑定到同一个 Y.Doc。
     * 后续所有改动都会先写入 Y.Doc，再由 provider 通过 WebSocket 同步到服务端。
     */
    Collaboration.configure({
      document: ydoc,
    }),
    /**
     * CollaborationCursor 会把当前用户信息写入 awareness，
     * 这样其他成员就能看到彩色光标和用户名标签。
     */
    CollaborationCursor.configure({
      provider,
      user: {
        id: currentUserProfile.id,
        name: currentUserProfile.name,
        color: currentUserProfile.color,
        avatar: currentUserProfile.avatar,
      },
      render: renderCursor,
    }),
    TextStyle,
    FontSizeExtension,
    Color,
    Highlight.configure({ multicolor: true }),
    Underline,
    Table.configure({
      resizable: false,
    }),
    TableRow,
    TableHeader,
    TableCell,
    Link.configure({
      openOnClick: false,
    }),
  ],
  editorProps: {
    attributes: {
      class: 'editor-surface',
    },
  },
  onCreate: ({ editor }) => {
    logCollab('tiptap editor created', {
      editable: editor.isEditable,
      empty: editor.isEmpty,
      textLength: editor.getText().length,
    })
  },
  onUpdate: ({ editor }) => {
    providerLogState.editorUpdates += 1
    if (providerLogState.editorUpdates <= 10 || providerLogState.editorUpdates % 20 === 0) {
      logCollab('tiptap editor update', {
        count: providerLogState.editorUpdates,
        textLength: editor.getText().length,
      })
    }
  },
  onDestroy: () => {
    logCollab('tiptap editor destroyed', {
      roomName: collaborationRoomName.value,
    })
  },
})

const visibleMembers = computed(() => {
  if (collaborationMembers.value.length > 0) {
    return collaborationMembers.value
  }
  return [
    {
      id: currentUserProfile.id,
      name: currentUserProfile.name,
      role: '我',
      avatar: currentUserProfile.avatar,
      active: true,
    },
    ...defaultOnlineMembers,
  ]
})

const connectionStatusText = computed(() => {
  if (connectionStatus.value === 'connected') {
    return documentSynced.value ? '协同已同步' : '已连接，等待同步'
  }
  if (connectionStatus.value === 'connecting') {
    return '正在连接协同服务'
  }
  return '协同连接已断开'
})

const currentFontSizeLabel = computed(() => {
  const value = editor.value?.getAttributes('textStyle')?.fontSize
  if (typeof value === 'string' && value.endsWith('px')) {
    return value.replace('px', '')
  }
  return selectedFontSize.value
})

const applyFontSize = (size: string) => {
  selectedFontSize.value = size
  const chain = editor.value?.chain().focus()
  if (!chain) return
  chain.setMark('textStyle', { fontSize: `${size}px` }).run()
}

const openTableDialog = () => {
  if (editor.value?.isActive('table')) {
    editor.value.chain().focus().deleteTable().run()
    return
  }
  tableDialogVisible.value = true
}

const insertCustomTable = () => {
  const rows = Math.max(1, Math.min(12, Number(tableRowsInput.value) || 3))
  const cols = Math.max(1, Math.min(8, Number(tableColsInput.value) || 3))
  tableRowsInput.value = rows
  tableColsInput.value = cols
  editor.value?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
  tableDialogVisible.value = false
}

const preventToolbarBlur = (event: MouseEvent) => {
  event.preventDefault()
}

const editorZoomStyle = computed(() => ({
  transform: `scale(${zoomPercent.value / 100})`,
  transformOrigin: 'top center',
}))

const decreaseZoom = () => {
  zoomPercent.value = Math.max(50, zoomPercent.value - 10)
}

const increaseZoom = () => {
  zoomPercent.value = Math.min(200, zoomPercent.value + 10)
}

const undoCollaboration = () => {
  undoManager.undo()
}

const redoCollaboration = () => {
  undoManager.redo()
}

const toolbarRows: ToolbarItem[][] = [
  [
    { icon: Undo2, action: undoCollaboration, label: '协同撤销' },
    { icon: Redo2, action: redoCollaboration, label: '协同重做' },
    { icon: Bold, action: () => editor.value?.chain().focus().toggleBold().run(), label: '粗体', active: () => editor.value?.isActive('bold') },
    { icon: Italic, action: () => editor.value?.chain().focus().toggleItalic().run(), label: '斜体', active: () => editor.value?.isActive('italic') },
    { icon: UnderlineIcon, action: () => editor.value?.chain().focus().toggleUnderline().run(), label: '下划线', active: () => editor.value?.isActive('underline') },
    { icon: Strikethrough, action: () => editor.value?.chain().focus().toggleStrike().run(), label: '删除线', active: () => editor.value?.isActive('strike') },
    {
      icon: Type,
      label: '字体颜色',
      accent: true,
      colorPreview: textColor,
      action: () => {
        const chain = editor.value?.chain().focus()
        if (!chain) return
        if (editor.value?.isActive('textStyle', { color: textColor })) {
          chain.unsetColor().run()
          return
        }
        chain.setColor(textColor).run()
      },
      active: () => editor.value?.isActive('textStyle', { color: textColor }),
    },
    {
      icon: Highlighter,
      label: '高亮',
      colorPreview: highlightColor,
      action: () => {
        const chain = editor.value?.chain().focus()
        if (!chain) return
        if (editor.value?.isActive('highlight', { color: highlightColor })) {
          chain.unsetHighlight().run()
          return
        }
        chain.toggleHighlight({ color: highlightColor }).run()
      },
      active: () => editor.value?.isActive('highlight', { color: highlightColor }),
    },
    { icon: List, action: () => editor.value?.chain().focus().toggleBulletList().run(), label: '无序列表', active: () => editor.value?.isActive('bulletList') },
    { icon: ListOrdered, action: () => editor.value?.chain().focus().toggleOrderedList().run(), label: '有序列表', active: () => editor.value?.isActive('orderedList') },
    { icon: Link2, action: () => editor.value?.chain().focus().extendMarkRange('link').setLink({ href: 'https://' }).run(), label: '插入链接' },
    { icon: Image, label: '插入图片' },
    {
      icon: Table2,
      label: '插入表格',
      action: openTableDialog,
      active: () => editor.value?.isActive('table'),
    },
    { icon: SquareCode, action: () => editor.value?.chain().focus().toggleCodeBlock().run(), label: '代码块', active: () => editor.value?.isActive('codeBlock') },
    { icon: Code2, action: () => editor.value?.chain().focus().toggleCode().run(), label: '行内代码', active: () => editor.value?.isActive('code') },
    { icon: Ellipsis, label: '更多' },
  ]
]

const wordCount = computed(() => {
  const text = editor.value?.getText() || ''
  return text.replace(/\s+/g, '').length || 1236
})

const handleBack = async () => {
  const teamId = String(route.params.id || '')
  logCollab('点击返回', {
    teamId,
    documentId: documentId.value,
    connectionStatus: connectionStatus.value,
    synced: documentSynced.value,
  })
  if (teamId) {
    await router.push({ path: `/teams/${teamId}`, query: { tab: 'collabDocs' } })
    return
  }
  await router.push('/dashboard')
}

let collaborationDisposed = false

function disposeCollaboration() {
  if (collaborationDisposed) {
    logCollab('dispose skipped: already disposed', {
      roomName: collaborationRoomName.value,
    })
    return
  }
  collaborationDisposed = true
  logCollab('dispose collaboration start', {
    roomName: collaborationRoomName.value,
    providerSynced: provider.synced,
    providerAttached: provider.isAttached,
    hasUnsyncedChanges: provider.hasUnsyncedChanges,
  })
  editor.value?.destroy()
  provider.destroy()
  undoManager.destroy()
  ydoc.off('update', handleYdocUpdate)
  ydoc.destroy()
  connectionStatus.value = 'disconnected'
  logCollab('dispose collaboration done', {
    roomName: collaborationRoomName.value,
  })
}

onBeforeRouteLeave(() => {
  disposeCollaboration()
})

onBeforeUnmount(() => {
  disposeCollaboration()
})
</script>

<template>
  <div class="collab-page">
    <div class="page-glow glow-a"></div>
    <div class="page-glow glow-b"></div>

    <header class="page-header">
      <div class="header-left">
        <button class="back-button" type="button" @click="handleBack">
          <ArrowLeft />
          <span>返回</span>
        </button>
        <div class="doc-meta">
          <h1>{{ documentTitle }}</h1>
          <div class="doc-status" :class="connectionStatus">
            <span class="status-dot"></span>
            <span>{{ connectionStatusText }}</span>
            <ChevronDown />
          </div>
        </div>
      </div>

      <div class="header-right">


        <button class="icon-button" type="button" aria-label="更多操作">
          <Ellipsis />
        </button>
      </div>
    </header>

    <section class="workspace-shell">
      <aside class="members-panel">
        <div class="panel-title">
          <span>在线成员</span>
          <span class="panel-count">({{ visibleMembers.length }})</span>
        </div>

        <div class="member-list">
          <div v-for="member in visibleMembers" :key="member.id" class="member-item">
            <div class="member-avatar-wrap">
              <img class="member-avatar" :src="member.avatar" :alt="member.name" />
              <span class="member-presence" :class="{ idle: !member.active }"></span>
            </div>
            <div class="member-name">{{ member.name }}</div>
            <span v-if="member.role" class="member-badge">{{ member.role }}</span>
          </div>
        </div>

        <button class="ghost-button" type="button">
          <User />
          <span>查看全部成员 (12)</span>
        </button>
      </aside>

      <main class="editor-panel">
        <div class="toolbar-shell">
          <div v-for="(row, rowIndex) in toolbarRows" :key="rowIndex" class="toolbar-row">
            <button
              v-for="item in row"
              :key="item.label"
              class="tool-button"
              :class="{ active: item.active?.(), wide: !!item.text, accent: item.accent }"
              :style="item.colorPreview && item.active?.() ? { backgroundColor: item.colorPreview === highlightColor ? '#fff7c7' : '#fff1ef' } : undefined"
              type="button"
              :title="item.label"
              @mousedown="preventToolbarBlur"
              @click="item.action?.()"
            >
              <template v-if="item.text">
                <span>{{ item.textValue || item.text }}</span>
                <ChevronDown />
              </template>
              <template v-else>
                <component :is="item.icon" v-if="item.icon" />
                <span v-if="item.colorPreview" class="tool-color-line" :style="{ backgroundColor: item.colorPreview }"></span>
              </template>
            </button>
          </div>
        </div>

        <div class="editor-controls-bar">
          <div class="font-size-group">
            <span class="control-label">字号</span>
            <button
              v-for="size in fontSizeOptions"
              :key="size"
              class="size-chip"
              :class="{ active: selectedFontSize === size }"
              type="button"
              @mousedown="preventToolbarBlur"
              @click="applyFontSize(size)"
            >
              {{ size }}
            </button>
          </div>

          <div v-if="tableDialogVisible" class="table-dialog">
            <span class="control-label">插入表格</span>
            <label>
              行
              <input v-model.number="tableRowsInput" type="number" min="1" max="12" />
            </label>
            <label>
              列
              <input v-model.number="tableColsInput" type="number" min="1" max="8" />
            </label>
            <button class="dialog-confirm" type="button" @click="insertCustomTable">确认</button>
            <button class="dialog-cancel" type="button" @click="tableDialogVisible = false">取消</button>
          </div>
        </div>

        <div class="editor-scroll">
          <div class="editor-zoom-shell">
            <div class="editor-zoom-stage" :style="editorZoomStyle">
              <EditorContent v-if="editor" :editor="editor" class="editor-host" />
            </div>
          </div>
        </div>

        <div class="editor-footer">
          <div class="footer-left">
            <span>字数：{{ wordCount }}</span>
            <span>中文(简体)</span>
          </div>
          <div class="footer-right">
            <span>{{ zoomPercent }}%</span>
            <button class="zoom-button" type="button" @click="decreaseZoom">
              <Minus />
            </button>
            <button class="zoom-button" type="button" @click="increaseZoom">
              <Plus />
            </button>
          </div>
        </div>
      </main>

      <div class="assistant-toggle">
        <ChevronsRight />
      </div>

      <aside class="assistant-panel">
        <div class="assistant-content">


          <div class="assistant-welcome">
            <div class="assistant-bot">
              <Bot />
            </div>
            <div class="assistant-copy">
              <h3>你好，我是你的文档助手</h3>
              <p>我可以帮你总结内容、回答问题、优化文案等。</p>
            </div>
          </div>

          <div class="assistant-chat">
            <div v-for="message in aiMessages.slice(1)" :key="message.id" class="chat-block">
              <div class="chat-time">{{ message.time }}</div>
              <div class="chat-row" :class="message.side">
                <div v-if="message.side === 'left'" class="chat-bubble assistant">
                  <div v-if="message.html" class="rich-message" v-html="message.html"></div>
                  <p v-else>{{ message.text }}</p>
                  <div class="message-actions">
                    <button type="button"><Copy /></button>
                    <button type="button"><ThumbsUp /></button>
                    <button type="button"><ThumbsDown /></button>
                  </div>
                </div>

                <template v-else>
                  <div class="chat-bubble user">
                    <p>{{ message.text }}</p>
                  </div>
                  <img class="mini-avatar" :src="message.avatar" :alt="message.id" />
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="assistant-footer">
          <div class="action-pills">
            <button v-for="action in quickActions" :key="action" type="button">{{ action }}</button>
          </div>

          <div class="assistant-input">
            <textarea placeholder="请输入你的问题..." rows="3"></textarea>
            <div class="input-tools">
              <button class="plain-tool" type="button">
                <WandSparkles />
              </button>
              <button class="send-tool" type="button">
                <Send />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </section>
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
  background:
    radial-gradient(circle at top left, rgba(61, 135, 255, 0.12), transparent 32%),
    radial-gradient(circle at top right, rgba(255, 181, 105, 0.16), transparent 28%),
    linear-gradient(180deg, #f4f7fb 0%, #eef3fb 100%);
}

:global(*) {
  box-sizing: border-box;
}

.collab-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  color: #182131;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.page-glow {
  position: absolute;
  border-radius: 999px;
  filter: blur(48px);
  pointer-events: none;
}

.glow-a {
  top: -120px;
  left: 18%;
  width: 320px;
  height: 320px;
  background: rgba(110, 171, 255, 0.18);
}

.glow-b {
  top: 30px;
  right: 16%;
  width: 260px;
  height: 260px;
  background: rgba(255, 212, 154, 0.26);
}

.page-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 16px 8px;
  border-bottom: 1px solid rgba(210, 220, 235, 0.9);
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(18px);
}

.header-left,
.header-right,
.doc-meta,
.member-stack,
.panel-title,
.assistant-title,
.footer-left,
.footer-right,
.input-tools {
  display: flex;
  align-items: center;
}

.header-left,
.header-right {
  gap: 18px;
}

.back-button,
.share-button,
.icon-button,
.tool-button,
.ghost-button,
.zoom-button,
.plain-tool,
.send-tool {
  border: 0;
  cursor: pointer;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 16px;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f5f8fd 100%);
  box-shadow: inset 0 0 0 1px #d8e2f1;
  color: #38465d;
  font-size: 16px;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.back-button :deep(svg),
.share-button :deep(svg),
.icon-button :deep(svg),
.ghost-button :deep(svg),
.plain-tool :deep(svg),
.send-tool :deep(svg),
.assistant-title :deep(svg),
.assistant-bot :deep(svg),
.assistant-toggle :deep(svg),
.message-actions :deep(svg),
.zoom-button :deep(svg),
.tool-button :deep(svg),
.doc-status :deep(svg) {
  width: 17px;
  height: 17px;
  stroke-width: 2;
  flex-shrink: 0;
}

.back-button:hover,
.share-button:hover,
.ghost-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(82, 112, 163, 0.12);
}

.doc-meta {
  gap: 18px;
}

.doc-meta h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.doc-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #8e98aa;
  font-size: 14px;
}

.doc-status.connected {
  color: #2c7a52;
}

.doc-status.connecting {
  color: #8b6b1a;
}

.doc-status.disconnected {
  color: #b24d4d;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d7dce6;
  box-shadow: 0 0 0 4px rgba(215, 220, 230, 0.35);
}

.doc-status.connected .status-dot {
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18);
}

.doc-status.connecting .status-dot {
  background: #f59e0b;
  box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.18);
}

.doc-status.disconnected .status-dot {
  background: #ef4444;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.18);
}

.member-stack img,
.more-count {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 6px 16px rgba(88, 108, 143, 0.14);
}

.member-stack img {
  margin-left: -10px;
  background: #fff;
  object-fit: cover;
}

.member-stack img:first-child {
  margin-left: 0;
}

.more-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: -10px;
  background: #f3f6fb;
  color: #53627d;
  font-size: 16px;
  font-weight: 600;
}

.share-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 14px;
  background: linear-gradient(135deg, #2f7fff 0%, #296df2 100%);
  color: #fff;
  font-size: 17px;
  font-weight: 600;
  box-shadow: 0 14px 26px rgba(47, 127, 255, 0.22);
}

.icon-button {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.88);
  color: #5f6f87;
  box-shadow: inset 0 0 0 1px #dbe2ee;
}

.icon-button,
.zoom-button,
.plain-tool,
.send-tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.workspace-shell {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 236px minmax(0, 1fr) 34px 390px;
  gap: 0;
  min-height: calc(100vh - 77px);
  padding: 0 4px 4px;
}

.members-panel,
.editor-panel,
.assistant-panel {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(12px);
}

.members-panel {
  padding: 16px 14px;
  border-right: 1px solid rgba(216, 226, 241, 0.92);
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.65);
}

.panel-title {
  gap: 8px;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 700;
}

.panel-count {
  color: #5f6f87;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 42px;
}

.member-avatar-wrap {
  position: relative;
  width: 34px;
  height: 34px;
}

.member-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
}

.member-presence {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 11px;
  height: 11px;
  border: 2px solid #fff;
  border-radius: 50%;
  background: #1ec56b;
}

.member-presence.idle {
  background: #c2cad8;
}

.member-name {
  flex: 1;
  font-size: 15px;
  color: #2b354b;
}

.member-badge {
  padding: 3px 8px;
  border-radius: 999px;
  background: #e9f1ff;
  color: #2c73ef;
  font-size: 12px;
  font-weight: 600;
}

.ghost-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  margin-top: 20px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #fbfcff;
  color: #637089;
  box-shadow: inset 0 0 0 1px #dce4f1;
  font-size: 15px;
}

.editor-panel {
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(220, 228, 241, 0.94);
  border-left: 1px solid rgba(255, 255, 255, 0.52);
}

.toolbar-shell {
  padding: 8px 12px 6px;
  border-bottom: 1px solid rgba(220, 228, 241, 0.94);
  background: rgba(255, 255, 255, 0.8);
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.toolbar-row + .toolbar-row {
  margin-top: 10px;
}

.tool-button {
  position: relative;
  min-width: 34px;
  height: 34px;
  padding: 0 10px;
  border-radius: 10px;
  background: transparent;
  color: #3c495f;
  font-size: 15px;
  transition: background-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}

.tool-button :deep(svg) {
  width: 16px;
  height: 16px;
}

.tool-color-line {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 6px;
  height: 3px;
  border-radius: 999px;
}

.tool-button:hover {
  background: #eef4ff;
}

.tool-button.wide {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 74px;
  justify-content: space-between;
  padding: 0 12px;
  box-shadow: inset 0 0 0 1px #e4e9f4;
}

.tool-button.active {
  background: #e9f1ff;
  color: #2268e3;
}

.tool-button.accent {
  color: #e05f54;
}

.editor-scroll {
  flex: 1;
  overflow: auto;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.96)),
    radial-gradient(circle at top center, rgba(154, 219, 255, 0.12), transparent 40%);
}

.editor-zoom-shell {
  display: flex;
  justify-content: center;
  padding: 0 0 28px;
}

.editor-zoom-stage {
  width: 100%;
  display: flex;
  justify-content: center;
  transition: transform 0.18s ease;
}

.editor-host {
  min-height: 100%;
}

:deep(.editor-surface) {
  width: min(100%, 820px);
  min-height: 280px;
  max-height: 420px;
  margin: 0 auto;
  padding: 24px 20px 32px;
  outline: none;
  color: #182131;
  font-size: 16px;
  line-height: 1.8;
}

:deep(.editor-surface strong),
:deep(.editor-surface b) {
  font-weight: 700;
}

:deep(.editor-surface span[style*='font-size']) {
  line-height: inherit;
}

:deep(.editor-surface h1) {
  margin: 0 0 14px;
  font-size: 26px;
  line-height: 1.3;
  font-weight: 700;
  color: #182131;
}

:deep(.editor-surface h2) {
  margin: 18px 0 10px;
  font-size: 18px;
  font-weight: 700;
  color: #1d2433;
}

:deep(.editor-surface h3) {
  margin: 12px 0 8px;
  font-size: 16px;
  font-weight: 600;
}

:deep(.editor-surface p) {
  margin: 0 0 12px;
}

:deep(.editor-surface mark) {
  padding: 0.08em 0.18em;
  border-radius: 4px;
}

:deep(.editor-surface ul) {
  margin: 0 0 12px;
  padding-left: 1.3em;
}

:deep(.editor-surface li) {
  margin: 6px 0;
}

:deep(.editor-surface [data-callout='checklist']) {
  margin: 14px 0 8px;
  padding: 16px 18px;
  border-radius: 14px;
  background: linear-gradient(90deg, rgba(234, 249, 241, 0.85), rgba(241, 250, 255, 0.92));
}

:deep(.editor-surface table) {
  width: 100%;
  margin-top: 14px;
  border-collapse: collapse;
  overflow: hidden;
  border-radius: 14px;
  box-shadow: inset 0 0 0 1px #dde4ef;
}

:deep(.editor-surface th),
:deep(.editor-surface td) {
  padding: 14px 16px;
  border: 1px solid #e3eaf4;
  text-align: left;
  font-size: 16px;
}

:deep(.editor-surface th) {
  background: #f7f9fd;
  color: #2a3953;
  font-weight: 700;
}

:deep(.editor-surface pre) {
  margin: 14px 0;
  padding: 14px 16px;
  border-radius: 12px;
  background: #1f2430;
  color: #edf2ff;
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.7;
}

:deep(.editor-surface code) {
  font-family: Consolas, 'Courier New', monospace;
}

:deep(.editor-surface :not(pre) > code) {
  padding: 0.1em 0.35em;
  border-radius: 6px;
  background: #eef3fb;
  color: #31486b;
}

:deep(.collaboration-cursor__caret) {
  position: relative;
  margin-left: -1px;
  margin-right: -1px;
  border-left: 2px solid #2f7fff;
  border-right: 2px solid transparent;
  pointer-events: none;
}

:deep(.collaboration-cursor__label) {
  position: absolute;
  top: -1.45em;
  left: -1px;
  padding: 3px 7px;
  border-radius: 999px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.editor-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 18px;
  border-top: 1px solid rgba(220, 228, 241, 0.94);
  color: #6f7d94;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.86);
}

.footer-left,
.footer-right {
  gap: 20px;
}

.zoom-button {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f4f7fb;
  color: #56657d;
  box-shadow: inset 0 0 0 1px #d8e1ef;
}

.editor-controls-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(220, 228, 241, 0.94);
  background: rgba(248, 251, 255, 0.86);
}

.font-size-group,
.table-dialog {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.control-label {
  color: #66758d;
  font-size: 13px;
  font-weight: 600;
}

.size-chip,
.dialog-confirm,
.dialog-cancel {
  border: 0;
  border-radius: 10px;
  padding: 7px 10px;
  font-size: 13px;
  cursor: pointer;
}

.size-chip {
  background: #ffffff;
  color: #415069;
  box-shadow: inset 0 0 0 1px #dbe4f0;
}

.size-chip.active {
  background: #e9f1ff;
  color: #2166df;
  box-shadow: inset 0 0 0 1px #bfd4ff;
}

.table-dialog {
  padding: 8px 10px;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px #dce5f0;
}

.table-dialog label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #5c6c85;
  font-size: 13px;
}

.table-dialog input {
  width: 56px;
  height: 32px;
  border: 1px solid #d7e1ee;
  border-radius: 8px;
  padding: 0 8px;
  color: #22314a;
  background: #fbfdff;
}

.dialog-confirm {
  background: #2f7fff;
  color: #fff;
}

.dialog-cancel {
  background: #eef3fb;
  color: #51607a;
}

.assistant-toggle {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10px;
  color: #4d5d77;
  background: rgba(255, 255, 255, 0.36);
}

.assistant-toggle i {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 48px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 6px 14px rgba(94, 111, 142, 0.12);
}

.assistant-panel {
  display: flex;
  flex-direction: column;
  padding: 0;
  border-left: 1px solid rgba(220, 228, 241, 0.92);
}

.assistant-content {
  flex: 1;
  overflow: auto;
  padding: 10px 12px 12px;
}

.assistant-footer {
  padding: 8px 12px 12px;
  border-top: 1px solid rgba(220, 228, 241, 0.92);
  background: rgba(255, 255, 255, 0.85);
}

.assistant-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 0 16px;
  border-bottom: 1px solid rgba(227, 234, 244, 0.98);
}

.assistant-title {
  gap: 10px;
  font-size: 15px;
  font-weight: 700;
}

.assistant-title i {
  color: #2d79f3;
}

.assistant-title :deep(svg) {
  color: #2d79f3;
}

.assistant-welcome {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  padding: 12px 12px;
  border-radius: 12px;
  background: linear-gradient(180deg, #f7fbff 0%, #f4f7fc 100%);
  box-shadow: inset 0 0 0 1px #edf2fa;
}

.assistant-bot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: linear-gradient(180deg, #d8e7ff 0%, #edf4ff 100%);
  color: #256ee9;
  font-size: 16px;
}

.assistant-copy h3 {
  margin: 2px 0 6px;
  font-size: 14px;
}

.assistant-copy p {
  margin: 0;
  color: #66758d;
  font-size: 13px;
  line-height: 1.6;
}

.assistant-chat {
  flex: 1;
  padding: 10px 2px 8px;
  overflow: auto;
}

.chat-block + .chat-block {
  margin-top: 12px;
}

.chat-time {
  margin-bottom: 6px;
  text-align: center;
  color: #9aa6b8;
  font-size: 12px;
}

.chat-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.chat-row.right {
  justify-content: flex-end;
}

.chat-bubble {
  max-width: 275px;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.6;
}

.chat-bubble p {
  margin: 0;
}

.chat-bubble.assistant {
  background: #fff;
  box-shadow: inset 0 0 0 1px #ebf0f8;
}

.chat-bubble.user {
  background: linear-gradient(180deg, #e8f1ff 0%, #dce8ff 100%);
  color: #294064;
}

.mini-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.rich-message :deep(ul) {
  margin: 10px 0 0;
  padding-left: 1.2em;
}

.rich-message :deep(li) {
  margin: 6px 0;
}

.message-actions {
  display: flex;
  gap: 6px;
  margin-top: 14px;
}

.message-actions button {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #71809a;
  cursor: pointer;
}

.message-actions button:hover {
  background: #f3f7fd;
}

.action-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 6px 0 10px;
}

.action-pills button {
  padding: 7px 10px;
  border: 1px solid #d5e2fb;
  border-radius: 999px;
  background: #fdfefe;
  color: #2a72ed;
  font-size: 12px;
  cursor: pointer;
}

.assistant-input {
  padding: 10px;
  border-radius: 12px;
  background: #fff;
  box-shadow: inset 0 0 0 1px #dce4f0;
}

.assistant-input textarea {
  width: 100%;
  resize: none;
  border: 0;
  outline: none;
  color: #26344d;
  font-size: 15px;
  line-height: 1.7;
  background: transparent;
  font-family: inherit;
}

.assistant-input textarea::placeholder {
  color: #9ba6b8;
}

.input-tools {
  justify-content: space-between;
  margin-top: 12px;
}

.plain-tool,
.send-tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.plain-tool {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: #f4f7fb;
  color: #74849d;
}

.send-tool {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2f7fff 0%, #2c6fee 100%);
  color: #fff;
  box-shadow: 0 12px 22px rgba(47, 127, 255, 0.22);
}

@media (max-width: 1380px) {
  .workspace-shell {
    grid-template-columns: 220px minmax(0, 1fr) 360px;
  }

  .assistant-toggle {
    display: none;
  }
}

@media (max-width: 1120px) {
  .workspace-shell {
    grid-template-columns: 1fr;
    padding: 0;
  }

  .members-panel,
  .assistant-panel {
    border: 0;
  }

  .members-panel {
    border-bottom: 1px solid rgba(220, 228, 241, 0.92);
  }

  .assistant-panel {
    border-top: 1px solid rgba(220, 228, 241, 0.92);
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-left,
  .header-right {
    justify-content: space-between;
  }
}
</style>

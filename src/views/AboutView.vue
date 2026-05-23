<template>
  <div class="about-page">
    <div class="about-card">
      <p class="tag">ABOUT TEAMUP</p>
      <h1>关于 TeamUp</h1>
      <p>面向学习小组的协同平台，连接任务、文档与智能助教。</p>
    </div>
  </div>
</template>

<style scoped>
.about-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 20px;
  background: linear-gradient(140deg, #fff8f0 0%, #f3f4ff 48%, #edfbff 100%);
}

.about-card {
  width: min(780px, 100%);
  border-radius: 28px;
  padding: 34px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 22px 44px rgba(31, 46, 84, 0.14);
}

.tag {
  margin: 0 0 8px;
  color: #8f6d85;
  font-size: 12px;
  letter-spacing: 0.16em;
  font-weight: 700;
}

h1 {
  margin: 0;
  color: #25263a;
  font-size: 34px;
}

p {
  margin-top: 12px;
  color: #5f6677;
  line-height: 1.8;
}
</style>

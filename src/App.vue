<script setup lang="ts">
import {
  ref,
  computed,
  reactive,
  watch,
  onMounted,
  onUnmounted,
  nextTick,
} from "vue";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronRight,
  BookOpen,
  Layers,
  Mic,
  Download,
  X,
  Maximize,
  Monitor,
  FolderOpen,
  Lightbulb,
  CircleCheck,
  ClipboardCheck,
  Users,
  Clock,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  ExternalLink,
  Compass,
  Sparkles,
} from "lucide-vue-next";
import BaseButton from "./components/BaseButton.vue";
import CourseTimer from "./components/CourseTimer.vue";
import { courses, stages } from "./data/courses";
import { resources, cases, type Resource } from "./data/resources";
import { parseRoute, parseProgress, emptyProgress } from "./lib/progress";

const key = "fando-workshop-progress-v1";
const storageError = ref("");
const initial = (() => {
  try {
    return parseProgress(localStorage.getItem(key));
  } catch {
    storageError.value =
      "本机记录无法读取。本次从空白记录开始，你可以导出记录备份。";
    return emptyProgress();
  }
})();
const progress = reactive(initial);
const route = ref(
  parseRoute(
    location.hash,
    courses.map((c) => c.id),
  ),
);
const course = computed(() =>
  courses.find((c) => c.id === route.value.courseId),
);
const stepIndex = computed(() =>
  Math.min(route.value.step, (course.value?.steps.length || 1) - 1),
);
const currentStep = computed(() => course.value?.steps[stepIndex.value]);
const instructor = ref(false);
const collapsed = ref(false);
const notice = ref("");
const modal = ref<HTMLDialogElement>();
const dialogType = ref<"resources" | "resource" | "cases" | "reset">(
  "resources",
);
const selectedResource = ref<Resource>();
let previousFocus: HTMLElement | null = null;
let noticeTimeout = 0;
const modalTitle = computed(() =>
  dialogType.value === "resource"
    ? selectedResource.value?.title
    : dialogType.value === "cases"
      ? "各岗位可以从哪里开始"
      : dialogType.value === "reset"
        ? "清空本机学习记录"
        : "课堂资料库",
);
const completed = (id: string) =>
  Object.entries(progress.checks).filter(
    ([k, v]) => k.startsWith(id + "/") && v,
  ).length;
const totalChecks = (id: string) =>
  courses
    .find((c) => c.id === id)
    ?.steps.reduce((sum, s) => sum + s.checks.length, 0) || 0;
const overallCompleted = computed(() =>
  courses.reduce((sum, c) => sum + completed(c.id), 0),
);
const overallTotal = courses.reduce((sum, c) => sum + totalChecks(c.id), 0);
const checkKey = (stepId: string, index: number) =>
  `${course.value?.id}/${stepId}/${index}`;
const stepComplete = (stepId: string) =>
  course.value?.steps
    .find((s) => s.id === stepId)
    ?.checks.every((_, i) => progress.checks[checkKey(stepId, i)]) || false;

watch(
  progress,
  () => {
    try {
      localStorage.setItem(key, JSON.stringify(progress));
      storageError.value = "";
    } catch {
      storageError.value =
        "本机保存失败，当前内容只在本次页面中保留。请先导出记录，刷新可能丢失。";
    }
  },
  { deep: true },
);
function notify(message: string) {
  notice.value = message;
  window.clearTimeout(noticeTimeout);
  noticeTimeout = window.setTimeout(() => (notice.value = ""), 5000);
}
function navigate(id = "", stage = 0, step = 0) {
  location.hash = id ? `/${id}/${stage}/${step}` : "/";
}
async function syncRoute() {
  route.value = parseRoute(
    location.hash,
    courses.map((c) => c.id),
  );
  await nextTick();
  window.scrollTo({ top: 0 });
  document.getElementById("page-title")?.focus({ preventScroll: true });
}
function next() {
  if (!course.value) return;
  if (
    route.value.stage === 2 &&
    stepIndex.value < course.value.steps.length - 1
  )
    navigate(course.value.id, 2, stepIndex.value + 1);
  else if (route.value.stage < 4)
    navigate(course.value.id, route.value.stage + 1);
  else {
    const c = courses[courses.indexOf(course.value) + 1];
    navigate(c?.id || "");
  }
}
function back() {
  if (!course.value) return;
  if (route.value.stage === 2 && stepIndex.value > 0)
    navigate(course.value.id, 2, stepIndex.value - 1);
  else if (route.value.stage > 0)
    navigate(
      course.value.id,
      route.value.stage - 1,
      route.value.stage === 3 ? course.value.steps.length - 1 : 0,
    );
  else navigate();
}
async function openDialog(type: typeof dialogType.value, resourceId?: string) {
  if (!modal.value?.open) {
    previousFocus = document.activeElement as HTMLElement | null;
  }
  dialogType.value = type;
  selectedResource.value = resources.find((r) => r.id === resourceId);
  await nextTick();
  if (!modal.value?.open) modal.value?.showModal();
}
function closeDialog() {
  modal.value?.close();
  previousFocus?.focus();
}
function focusContent() {
  const content = document.getElementById("main-content");
  content?.setAttribute("tabindex", "-1");
  content?.focus();
}
function download(content: string, filename: string) {
  try {
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + content], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
    notify("已发起下载，请查看浏览器下载列表。");
  } catch {
    notify("下载未成功，请在资料预览中选中文本保存。");
  }
}
function exportProgress() {
  const sections = courses.map(
    (c) =>
      `## ${c.number} ${c.title}\n\n自检 ${completed(c.id)}/${totalChecks(c.id)}（手动记录，非讲师验收）\n\n${c.steps.map((s) => `### ${s.title}\n${s.checks.map((x, i) => `- [${progress.checks[`${c.id}/${s.id}/${i}`] ? "x" : " "}] ${x}`).join("\n")}`).join("\n\n")}\n\n成果位置与复盘：\n${progress.notes[c.id] || "尚未填写"}\n`,
  );
  download(
    `# FanDo 实操工作坊记录\n\n小组 / 姓名：${progress.group || "未填写"}\n导出时间：${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}（Asia/Shanghai）\n记录来自当前浏览器，未提交服务器。\n\n${sections.join("\n")}`,
    "FanDo-实操记录.md",
  );
}
function resetProgress() {
  Object.assign(progress, emptyProgress());
  closeDialog();
  notify("已清空本机课程自检和成果记录。");
}
async function fullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    notify("当前浏览器不支持页面全屏，请使用浏览器的全屏功能。");
  }
}
function keyboard(event: KeyboardEvent) {
  const target = event.target as HTMLElement;
  if (
    modal.value?.open ||
    target.closest("input,textarea,select,button,a,summary,[contenteditable]")
  )
    return;
  if (event.key === "ArrowRight" && course.value) {
    event.preventDefault();
    next();
  }
  if (event.key === "ArrowLeft" && course.value) {
    event.preventDefault();
    back();
  }
}
onMounted(() => {
  window.addEventListener("hashchange", syncRoute);
  window.addEventListener("keydown", keyboard);
});
onUnmounted(() => {
  window.removeEventListener("hashchange", syncRoute);
  window.removeEventListener("keydown", keyboard);
  window.clearTimeout(noticeTimeout);
});
</script>

<template>
  <a class="skip-link" href="#main-content" @click.prevent="focusContent"
    >跳到课程内容</a
  >
  <div
    class="app-shell"
    :class="{ 'is-presenting': instructor, 'rail-collapsed': collapsed }"
  >
    <header class="topbar">
      <a href="#/" class="brand" aria-label="FanDo 工作坊首页"
        ><span class="brand-mark">F<span></span></span
        ><span class="brand-name"
          >FanDo<span class="brand-divider"></span
          ><span class="brand-subtitle">AI 实操工作坊</span></span
        ></a
      >
      <div class="top-actions">
        <span class="edition">索否管理层专场</span
        ><BaseButton quiet @click="openDialog('resources')"
          ><FolderOpen :size="17" /><span>资料库</span></BaseButton
        ><BaseButton
          quiet
          :aria-pressed="instructor"
          @click="instructor = !instructor"
          ><Monitor :size="17" /><span>{{
            instructor ? "退出讲师模式" : "讲师模式"
          }}</span></BaseButton
        ><BaseButton quiet aria-label="切换全屏" @click="fullscreen"
          ><Maximize :size="18"
        /></BaseButton>
      </div>
    </header>
    <div v-if="storageError" class="storage-error" role="alert">
      {{ storageError }} <button @click="exportProgress">导出备份</button>
    </div>
    <main v-if="!course" id="main-content" class="home">
      <div class="home-heading">
        <span class="eyebrow">FANDO WORKSHOP / 2026.09</span
        ><span class="date-label"
          ><span class="status-dot"></span> 9 月 11 日 · 企业实操工作坊</span
        >
      </div>
      <section class="hero">
        <div class="hero-copy">
          <div class="eyebrow light">从自己的工作出发</div>
          <h1 id="page-title" tabindex="-1">
            让 AI 真正参与<br />你的日常工作
          </h1>
          <p>
            用一个真实问题开始，在动手、提问和修改中，<br
              class="desktop-break"
            />建立属于你和团队的 AI 工作方法。
          </p>
          <BaseButton primary @click="navigate('agent')"
            >开始第一节课 <ArrowRight :size="18" /></BaseButton
          ><span class="hero-footnote">带上电脑，也带上你的业务经验</span>
        </div>
        <div class="hero-route" aria-label="课程成长路径">
          <span class="route-caption">今天，带走一条完整的工作链路</span>
          <div v-for="(c, i) in courses" :key="c.id" class="hero-route-row">
            <span class="route-num">{{ c.number }}</span>
            <div>
              <strong>{{
                [
                  "完成一份工作成果",
                  "沉淀一个可复用 Skill",
                  "教 AI 理解你的业务",
                  "让值得做的事持续运行",
                ][i]
              }}</strong
              ><small>{{
                ["Agent 上手", "Skill 共创", "业务自学习", "48 小时挑战"][i]
              }}</small>
            </div>
            <Check
              v-if="completed(c.id) === totalChecks(c.id)"
              :size="18"
            /><ArrowRight v-else :size="17" />
          </div>
        </div>
      </section>
      <div class="home-summary">
        <span><Users :size="17" /> 小组共创 <b>建议 8 组 × 5 人</b></span
        ><span><Mic :size="17" /> 语音优先 <b>用自己的话讲需求</b></span
        ><span
          ><ClipboardCheck :size="17" /> 成果导向
          <b>每一步都有检查标准</b></span
        >
      </div>
      <section class="curriculum">
        <div class="section-heading">
          <div>
            <span class="eyebrow">THE LEARNING PATH</span>
            <h2>四节课，逐步做出自己的成果</h2>
          </div>
          <span class="small muted">可按顺序学习，也可直接进入任意一节</span>
        </div>
        <div class="course-grid">
          <a
            v-for="c in courses"
            :key="c.id"
            :href="`#/${c.id}/0/0`"
            class="course-card"
            ><div class="course-card-top">
              <span class="course-number">{{ c.number }}</span
              ><span class="course-duration"
                ><Clock :size="14" /> 约 {{ c.minutes }} 分钟{{
                  c.id === "loop" ? " + 课后观察" : ""
                }}</span
              >
            </div>
            <h3>{{ c.title }}</h3>
            <p>{{ c.subtitle }}</p>
            <div class="card-outcome"><span>本节交付</span>{{ c.outcome }}</div>
            <div class="course-card-bottom">
              <span v-if="completed(c.id)" class="small"
                >已自检 {{ completed(c.id) }}/{{ totalChecks(c.id) }} 项</span
              ><span v-else class="small">{{ c.keywords.join(" · ") }}</span
              ><span class="enter-link"
                >进入课程 <ArrowRight :size="17"
              /></span></div
          ></a>
        </div>
      </section>
      <section class="before-start">
        <div>
          <span class="section-kicker"
            ><Compass :size="18" /> 开始前，准备好这几件事</span
          >
          <p>
            FanDo 账号与可用额度、办公渠道授权、一份允许使用的业务材料。<br />操作卡住时先检查任务状态，再请助教协助。
          </p>
        </div>
        <BaseButton @click="openDialog('cases')"
          >看看岗位场景 <ArrowRight :size="16"
        /></BaseButton>
      </section>
      <footer class="home-footer">
        <span>FanDo · 企业 AI 实操工作坊</span
        ><span>建议时间供控场参考，按实际完成进度调整</span
        ><span>本机自检 {{ overallCompleted }}/{{ overallTotal }} 项</span>
      </footer>
    </main>

    <div v-else class="workspace">
      <aside class="sidebar">
        <div class="rail-top">
          <a href="#/" aria-label="返回课程首页"
            ><ArrowLeft :size="16" /><span>课程总览</span></a
          ><button
            :aria-label="collapsed ? '展开导航' : '收起导航'"
            @click="collapsed = !collapsed"
          >
            <PanelLeftOpen v-if="collapsed" :size="17" /><PanelLeftClose
              v-else
              :size="17"
            />
          </button>
        </div>
        <span class="rail-label">本次课程</span>
        <nav aria-label="课程导航">
          <a
            v-for="c in courses"
            :key="c.id"
            :href="`#/${c.id}/0/0`"
            :class="{ active: c.id === course.id }"
            :aria-current="c.id === course.id ? 'page' : undefined"
            :title="c.title"
            ><span class="rail-number">{{ c.number }}</span
            ><span>{{ c.title }}</span
            ><ChevronRight :size="14"
          /></a>
        </nav>
        <div class="rail-progress">
          <div>
            <span>本节自检进度</span
            ><b>{{ completed(course.id) }}/{{ totalChecks(course.id) }}</b>
          </div>
          <progress
            :value="completed(course.id)"
            :max="totalChecks(course.id)"
          ></progress>
          <p>手动自检记录，仅保存在此浏览器。</p>
        </div>
        <div class="rail-bottom">
          <Mic :size="20" /><strong>讲出来，试一试，再改进</strong>
          <p>提纲只是引导。<br />你的业务背景，由你补充。</p>
        </div>
      </aside>
      <main id="main-content" class="lesson-main">
        <div class="lesson-heading">
          <div class="breadcrumb">
            实操工作坊 <ChevronRight :size="13" /> 第 {{ course.number }} 节
          </div>
          <div class="lesson-heading-row">
            <div>
              <h1 id="page-title" tabindex="-1">{{ course.title }}</h1>
              <p>{{ course.subtitle }}</p>
            </div>
            <span class="lesson-counter"
              >{{ course.number }}<span> / 04</span></span
            >
          </div>
        </div>
        <nav class="stage-tabs" aria-label="课程阶段">
          <a
            v-for="(stage, i) in stages"
            :key="stage"
            :href="`#/${course.id}/${i}/0`"
            :class="{ active: route.stage === i }"
            :aria-current="route.stage === i ? 'step' : undefined"
            ><span>{{ String(i + 1).padStart(2, "0") }}</span
            >{{ stage }}</a
          >
        </nav>
        <div class="lesson-layout">
          <div class="lesson-content">
            <section
              v-if="route.stage === 0"
              class="content-panel objective-panel"
            >
              <span class="eyebrow">01 / YOUR MISSION</span>
              <h2>这节课，要完成什么？</h2>
              <p class="lead">{{ course.intro }}</p>
              <div class="mission">
                <span class="section-kicker"
                  ><Layers :size="18" /> 本节核心交付</span
                >
                <h3>{{ course.outcome }}</h3>
              </div>
              <div class="thinking-question">
                <Lightbulb :size="22" />
                <div>
                  <strong>先想一个与你有关的问题</strong>
                  <p>{{ course.question }}</p>
                </div>
              </div>
              <h3 class="subheading">完成的标准，提前看清</h3>
              <ul class="check-list">
                <li v-for="d in course.deliverables" :key="d">
                  <CircleCheck :size="18" />{{ d }}
                </li>
              </ul>
              <div class="inline-note">
                <Mic :size="18" />
                请用语音讲清自己的需求，按提纲补充业务背景；不方便使用语音时可用文字完成。
              </div>
            </section>
            <section v-if="route.stage === 1" class="content-panel">
              <span class="eyebrow">02 / KNOW BEFORE YOU DO</span>
              <h2>带着这些理解，开始动手</h2>
              <div class="knowledge-list">
                <article v-for="(k, i) in course.knowledge" :key="k.title">
                  <span class="knowledge-num">{{
                    String(i + 1).padStart(2, "0")
                  }}</span>
                  <div>
                    <h3>{{ k.title }}</h3>
                    <p>{{ k.body }}</p>
                  </div>
                </article>
              </div>
              <BaseButton
                v-if="course.id === 'agent' || course.id === 'skill'"
                @click="openDialog('cases')"
                ><Sparkles :size="17" /> 查看各岗位探索方向</BaseButton
              >
              <div v-if="course.id === 'learning'" class="rubric-inline">
                <h3>先看评分，再开始探索</h3>
                <p>探索深度 35% · 迭代韧性 35% · 互动质量 30%</p>
                <small
                  >看你如何补充背景、发现遗漏与纠正理解，不只看最终报告。</small
                >
              </div>
            </section>
            <section
              v-if="route.stage === 2 && currentStep"
              class="practice-section"
            >
              <div class="step-picker" aria-label="实操步骤">
                <a
                  v-for="(s, i) in course.steps"
                  :key="s.id"
                  :href="`#/${course.id}/2/${i}`"
                  :aria-current="i === stepIndex ? 'step' : undefined"
                  :class="{ active: i === stepIndex, done: stepComplete(s.id) }"
                  ><span
                    ><Check v-if="stepComplete(s.id)" :size="13" /><template
                      v-else
                      >{{ i + 1 }}</template
                    ></span
                  >{{ s.title }}</a
                >
              </div>
              <section class="content-panel practice-panel">
                <div class="practice-heading">
                  <span class="eyebrow"
                    >STEP {{ String(stepIndex + 1).padStart(2, "0") }} /
                    {{ String(course.steps.length).padStart(2, "0") }}</span
                  ><span class="small muted"
                    >建议 {{ currentStep.minutes }} 分钟</span
                  >
                </div>
                <h2>{{ currentStep.title }}</h2>
                <p class="lead">{{ currentStep.goal }}</p>
                <div v-if="currentStep.resource" class="resource-strip">
                  <FileText :size="20" />
                  <div>
                    <strong>{{
                      resources.find((r) => r.id === currentStep?.resource)
                        ?.title
                    }}</strong
                    ><span>本步骤配套资料 · 可预览和下载</span>
                  </div>
                  <BaseButton
                    @click="openDialog('resource', currentStep.resource)"
                    >打开资料 <ArrowRight :size="15"
                  /></BaseButton>
                </div>
                <h3 class="subheading">现在这样做</h3>
                <ol class="action-list">
                  <li v-for="(action, i) in currentStep.actions" :key="action">
                    <span>{{ i + 1 }}</span>
                    <p>{{ action }}</p>
                  </li>
                </ol>
                <section class="voice-guide">
                  <span class="section-kicker"
                    ><Mic :size="18" /> 用自己的话，讲清这些点</span
                  >
                  <p v-for="prompt in currentStep.speak" :key="prompt">
                    {{ prompt }}
                  </p>
                  <small>在 FanDo 或已连接的办公渠道中表达，网页不录音。</small>
                </section>
                <div class="tip">
                  <Lightbulb :size="19" />
                  <p>{{ currentStep.tip }}</p>
                </div>
                <section class="step-checks">
                  <h3><ClipboardCheck :size="18" /> 做完后，亲自检查</h3>
                  <label v-for="(check, i) in currentStep.checks" :key="check"
                    ><input
                      v-model="progress.checks[checkKey(currentStep.id, i)]"
                      type="checkbox"
                    /><span>{{ check }}</span></label
                  ><small
                    >勾选仅表示你已自检，不代表讲师验收或后台任务完成。</small
                  >
                </section>
              </section>
            </section>
            <section v-if="route.stage === 3" class="content-panel">
              <span class="eyebrow">04 / DELIVER & CHECK</span>
              <h2>带着成果，完成这一节</h2>
              <p class="lead">
                先打开实际成果检查，再记录位置与需要改进的地方。
              </p>
              <ul class="deliverable-list">
                <li v-for="(d, i) in course.deliverables" :key="d">
                  <span>{{ String(i + 1).padStart(2, "0") }}</span
                  ><strong>{{ d }}</strong>
                </li>
              </ul>
              <h3 class="subheading">按这些标准评议</h3>
              <div class="rubric">
                <article v-for="r in course.rubric" :key="r.name">
                  <div>
                    <strong>{{ r.name }}</strong
                    ><b>{{ r.weight }}<small>%</small></b>
                  </div>
                  <p>{{ r.detail }}</p>
                </article>
              </div>
              <p class="small muted">{{ course.rubricNote }}</p>
              <div class="notes-form">
                <label for="group">小组 / 姓名（选填）</label
                ><input
                  id="group"
                  v-model="progress.group"
                  maxlength="80"
                  placeholder="例如：第一组"
                /><label for="notes">成果位置与复盘记录（选填）</label
                ><textarea
                  id="notes"
                  v-model="progress.notes[course.id]"
                  rows="5"
                  maxlength="12000"
                  placeholder="记录文件名或成果链接、已验证结果、待改进问题。请勿填写密码或敏感业务内容。"
                ></textarea
                ><span class="small muted"
                  >仅保存在当前浏览器。导出后，由讲师指定渠道收集，网页不会上传作业。</span
                ><BaseButton @click="exportProgress"
                  ><Download :size="17" /> 导出实操记录</BaseButton
                >
              </div>
            </section>
            <section v-if="route.stage === 4" class="content-panel">
              <span class="eyebrow">05 / SHOW YOUR WORK</span>
              <h2>让大家看见，你是怎么做成的</h2>
              <p class="lead">
                建议每组用 2 分钟，讲清业务价值、真实成果和一次有用的改进。
              </p>
              <div class="share-list">
                <article v-for="(q, i) in course.share" :key="q">
                  <span>0{{ i + 1 }}</span>
                  <h3>{{ q }}</h3>
                </article>
              </div>
              <div class="mission">
                <span class="section-kicker"
                  ><Compass :size="18" /> 带回工作中的下一步</span
                >
                <p>
                  {{
                    course.id === "loop"
                      ? "按原定时间检查任务是否停止，完成 48 小时复盘，再决定是否继续。"
                      : "为这项能力选一个下周要用的真实场景，并确定谁来检查结果。"
                  }}
                </p>
              </div>
              <BaseButton @click="exportProgress"
                ><Download :size="17" /> 导出本机实操记录</BaseButton
              >
            </section>
            <section v-if="instructor" class="instructor-note">
              <span class="section-kicker"
                ><Monitor :size="17" /> 讲师控场提示</span
              >
              <p>{{ course.instructor }}</p>
              <p class="small">
                讲师模式仅调整展示，不提供管理员权限。按 ← / →
                切换页面；输入时不触发翻页。
              </p>
            </section>
            <nav class="page-navigation" aria-label="翻页">
              <BaseButton @click="back"
                ><ArrowLeft :size="16" />{{
                  route.stage === 0 ? "课程总览" : "上一步"
                }}</BaseButton
              ><span
                >{{ route.stage + 1 }} / 5
                <span class="muted">{{ stages[route.stage] }}</span></span
              ><BaseButton primary @click="next"
                >{{
                  route.stage === 4
                    ? course.id === "loop"
                      ? "返回课程总览"
                      : "进入下一节课"
                    : "下一步"
                }}<ArrowRight :size="16"
              /></BaseButton>
            </nav>
          </div>
          <aside class="context-column">
            <CourseTimer
              :minutes="
                route.stage === 2
                  ? currentStep?.minutes || 10
                  : route.stage === 4
                    ? 2
                    : 10
              "
              :context="`${course.id}/${route.stage}/${stepIndex}`"
            />
            <section class="context-card">
              <span class="section-kicker"
                ><BookOpen :size="16" /> 本节带走</span
              >
              <ul>
                <li v-for="d in course.deliverables" :key="d">
                  <span></span>{{ d }}
                </li>
              </ul>
            </section>
            <section class="waiting-card">
              <span class="section-kicker"
                ><Lightbulb :size="16" /> AI 还在执行？</span
              >
              <p>
                先看任务状态，检查输入与目标。等待回复后再继续，避免连续催促或反复重开。
              </p>
              <p>报错时保留问题，请助教协助。</p>
            </section>
            <button class="export-link" @click="exportProgress">
              <Download :size="16" /> 导出实操记录
            </button>
          </aside>
        </div>
        <footer class="lesson-footer">
          <span>FanDo · 企业 AI 实操工作坊</span
          ><span>本地自检 · 未接入作业上传与自动评分</span>
        </footer>
      </main>
    </div>
    <div v-if="notice" class="toast" role="status">{{ notice }}</div>
    <dialog
      ref="modal"
      class="resource-dialog"
      aria-labelledby="dialog-title"
      @close="previousFocus?.focus()"
    >
      <header>
        <div>
          <span class="eyebrow">WORKSHOP RESOURCES</span>
          <h2 id="dialog-title">{{ modalTitle }}</h2>
        </div>
        <BaseButton aria-label="关闭弹窗" @click="closeDialog"
          ><X :size="19"
        /></BaseButton>
      </header>
      <div v-if="dialogType === 'resources'" class="resource-list">
        <p class="muted">
          课堂使用的模拟素材与检查提纲。下载后交给你的
          Agent，结合自己的话说明需求。
        </p>
        <article v-for="r in resources" :key="r.id">
          <FileText :size="22" />
          <div>
            <h3>{{ r.title }}</h3>
            <p>{{ r.description }}</p>
          </div>
          <BaseButton @click="openDialog('resource', r.id)">预览</BaseButton
          ><BaseButton
            :aria-label="`下载${r.title}`"
            @click="download(r.content, r.filename)"
            ><Download :size="17"
          /></BaseButton>
        </article>
        <a
          class="original-resource"
          href="./materials/Q3-reference.docx"
          download
          ><Download :size="17" /> 下载原 Q3 工作计划参考 Word
          <span>完成练习后再对照 · 模拟数据</span></a
        >
        <div class="resource-footer">
          <span>本机自检 {{ overallCompleted }}/{{ overallTotal }} 项</span
          ><BaseButton @click="exportProgress">导出记录</BaseButton
          ><button class="reset-button" @click="openDialog('reset')">
            <RotateCcw :size="14" /> 清空本机记录
          </button>
        </div>
      </div>
      <div v-else-if="dialogType === 'resource' && selectedResource">
        <p class="muted">{{ selectedResource.description }}</p>
        <pre class="resource-content" tabindex="0">{{
          selectedResource.content
        }}</pre>
        <div class="dialog-actions">
          <BaseButton @click="openDialog('resources')">返回资料库</BaseButton
          ><BaseButton
            primary
            @click="
              download(selectedResource.content, selectedResource.filename)
            "
            ><Download :size="17" /> 下载资料</BaseButton
          >
        </div>
      </div>
      <div v-else-if="dialogType === 'cases'">
        <p class="muted">
          以下为各职能正在探索的 AI
          应用方向，用于选题启发，不表示本次课程已实现这些业务效果。
        </p>
        <div class="case-grid">
          <article v-for="c in cases" :key="c.title">
            <h3>{{ c.title }}</h3>
            <p>{{ c.task }}</p>
            <span>{{ c.question }}</span>
          </article>
        </div>
        <a
          class="source-link"
          href="https://jqx28l0j4lx.feishu.cn/docx/JGbwd3oUxoXFM6xuB23cd1Ltnvd"
          target="_blank"
          rel="noopener noreferrer"
          >阅读各职能能力参考 <ExternalLink :size="14"
        /></a>
      </div>
      <div v-else-if="dialogType === 'reset'">
        <p>
          将清空此浏览器中的所有课程勾选、小组名称和成果笔记。已下载文件不受影响。
        </p>
        <p>如需保留，请先导出实操记录。</p>
        <div class="dialog-actions">
          <BaseButton @click="closeDialog">取消</BaseButton
          ><BaseButton @click="exportProgress">先导出记录</BaseButton
          ><BaseButton @click="resetProgress">清空本机记录</BaseButton>
        </div>
      </div>
    </dialog>
  </div>
</template>

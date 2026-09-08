import { StrictMode, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  GraduationCap,
  Info,
  Layers3,
  Lightbulb,
  Moon,
  Route,
  Search,
  Sun,
  Target,
  X,
} from "lucide-react";
import { courseConfig } from "./config";
import { downloadLabPackage } from "./labPackage";
import labsData from "./labs.json";
import variantsData from "./variants.json";
import "./styles.css";

type Lecture = { title: string; url: string };
type Variant = {
  id: number;
  code: string;
  title: string;
  system: string;
  roles: string[];
  objects: string[];
  process: string;
  conflict: string;
};
type Lab = {
  id: string;
  course: 3 | 4;
  semester: 5 | 6 | 7;
  number: number;
  title: string;
  section: string;
  lectures: Lecture[];
  goal: string;
  skill: string;
  situation: string;
  inputs: string[];
  artifact: string;
  artifact_fields: string[];
  decision: string;
  example: string;
  expected: string;
  quality: string;
  typical_error: string;
  demo: string;
  remember: string[];
  reportUrl: string;
  lmsUrl: string;
  durationBlocks: number;
  points: number;
};

const labs = labsData as Lab[];
const variants = variantsData as Variant[];
const allSections = [...new Set(labs.map((lab) => lab.section))];
const assetUrl = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const formatPoints = (points: number) =>
  `${points} ${points === 1 ? "балл" : points < 5 ? "балла" : "баллов"}`;
const semesterStats = [5, 6, 7].map((semester) => ({
  semester,
  count: labs.filter((lab) => lab.semester === semester).length,
  points: labs
    .filter((lab) => lab.semester === semester)
    .reduce((sum, lab) => sum + lab.points, 0),
}));

function getRoute() {
  const match = window.location.hash.match(/^#\/lab\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function App() {
  const [activeLabId, setActiveLabId] = useState(getRoute);
  const [variantId, setVariantId] = useState(
    () => Number(localStorage.getItem("pidis-variant")) || 1,
  );
  const [theme, setTheme] = useState(
    () => localStorage.getItem("pidis-theme") || "light",
  );
  const [teacherOpen, setTeacherOpen] = useState(false);
  const pageStartRef = useRef<HTMLElement>(null);
  const variant = variants.find((item) => item.id === variantId) || variants[0];
  useEffect(() => {
    const onHashChange = () => setActiveLabId(getRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("pidis-theme", theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem("pidis-variant", String(variantId));
  }, [variantId]);
  useEffect(() => {
    const lab = labs.find((item) => item.id === activeLabId);
    document.title = lab
      ? `${lab.id} · ${lab.title}`
      : `${courseConfig.code} · лабораторные работы`;
    window.scrollTo({ top: 0, behavior: "instant" });
    pageStartRef.current?.focus({ preventScroll: true });
  }, [activeLabId]);
  const activeLab = labs.find((item) => item.id === activeLabId);
  return (
    <div className="site-shell">
      <SiteHeader
        theme={theme}
        onTheme={() => setTheme(theme === "light" ? "dark" : "light")}
        onTeacher={() => setTeacherOpen(true)}
      />
      {activeLab ? (
        <LabPage
          lab={activeLab}
          variant={variant}
          onVariantChange={setVariantId}
          pageStartRef={pageStartRef}
        />
      ) : (
        <Catalog
          variant={variant}
          onVariantChange={setVariantId}
          pageStartRef={pageStartRef}
        />
      )}
      {teacherOpen && <TeacherDialog onClose={() => setTeacherOpen(false)} />}
    </div>
  );
}

function SiteHeader({
  theme,
  onTheme,
  onTeacher,
}: {
  theme: string;
  onTheme: () => void;
  onTeacher: () => void;
}) {
  return (
    <header className="site-header">
      <a className="brand" href="#/" aria-label="На главную">
        <img
          src={assetUrl("brand/synergy-logo.png")}
          alt="Университет Синергия"
        />
        <span>
          <b>{courseConfig.code}</b>
          <small>Лабораторный практикум</small>
        </span>
      </a>
      <div className="header-actions">
        <button type="button" onClick={onTeacher}>
          <Info aria-hidden="true" />
          Данные преподавателя
        </button>
        <button
          className="theme-toggle"
          type="button"
          onClick={onTheme}
          aria-label="Переключить тему"
          title="Переключить тему"
        >
          {theme === "light" ? (
            <Moon aria-hidden="true" />
          ) : (
            <Sun aria-hidden="true" />
          )}
        </button>
      </div>
    </header>
  );
}

function TeacherDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="teacher-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="teacher-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Закрыть">
          <X />
        </button>
        <p className="eyebrow">ПРЕПОДАВАТЕЛЬ</p>
        <h2 id="teacher-title">{courseConfig.teacher.name}</h2>
        <p>{courseConfig.teacher.role}</p>
        <p>{courseConfig.teacher.contact}</p>
      </section>
    </div>
  );
}

function VariantPicker({
  variant,
  onChange,
  compact = false,
}: {
  variant: Variant;
  onChange: (id: number) => void;
  compact?: boolean;
}) {
  return (
    <section
      className={`variant-picker${compact ? " compact" : ""}`}
      id={compact ? undefined : "variants"}
      aria-labelledby={compact ? undefined : "variant-title"}
    >
      <div>
        <p className="eyebrow">СКВОЗНОЙ ВАРИАНТ</p>
        {!compact && (
          <h2 id="variant-title">Одна предметная область на весь проект</h2>
        )}
        <p>
          Выбор сохраняется для всех трёх семестров и входит в скачиваемый
          комплект.
        </p>
      </div>
      <label>
        <span>Предметная область</span>
        <select
          value={variant.id}
          onChange={(event) => onChange(Number(event.target.value))}
        >
          {variants.map((item) => (
            <option key={item.id} value={item.id}>
              {item.code} · {item.title}
            </option>
          ))}
        </select>
      </label>
      <article className="variant-summary">
        <b>{variant.system}</b>
        <span>{variant.process}</span>
        <small>Проектное противоречие: {variant.conflict}.</small>
      </article>
    </section>
  );
}

function Catalog({
  pageStartRef,
  variant,
  onVariantChange,
}: {
  pageStartRef: React.RefObject<HTMLElement | null>;
  variant: Variant;
  onVariantChange: (id: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [semester, setSemester] = useState("all");
  const [section, setSection] = useState("all");
  const visible = useMemo(
    () =>
      labs.filter((lab) => {
        const haystack =
          `${lab.id} ${lab.title} ${lab.section} ${lab.artifact} ${lab.goal}`.toLocaleLowerCase(
            "ru",
          );
        return (
          (semester === "all" || String(lab.semester) === semester) &&
          (section === "all" || lab.section === section) &&
          haystack.includes(query.trim().toLocaleLowerCase("ru"))
        );
      }),
    [query, section, semester],
  );
  return (
    <>
      <a className="skip-link" href="#course-structure">
        К структуре курса
      </a>
      <main className="home" ref={pageStartRef} tabIndex={-1}>
        <section className="hero">
          <div className="hero__copy">
            <p className="eyebrow">
              {courseConfig.academicYear} · 20 РАБОТ · 100 БАЛЛОВ
            </p>
            <h1>
              Проектирование начинается <span>с проверяемого решения</span>
            </h1>
            <p>
              Сквозной проект: от требований и данных к интерфейсам, доступу и
              проектной документации.
            </p>
          </div>
          <div className="hero__visual">
            <img src={assetUrl("brand/rhino-designer.webp")} alt="" />
          </div>
        </section>
        <section className="course-structure" id="course-structure">
          <div className="section-heading">
            <p className="eyebrow">СТРУКТУРА КУРСА</p>
            <h2>Три этапа одного проекта</h2>
          </div>
          <div className="semester-grid">
            {semesterStats.map((item, index) => (
              <article key={item.semester}>
                <span>0{index + 1}</span>
                <h3>{item.semester} семестр</h3>
                <p>
                  {item.count} работ · {item.points} баллов
                </p>
              </article>
            ))}
          </div>
        </section>
        <VariantPicker variant={variant} onChange={onVariantChange} />
        <section className="catalog" id="labs">
          <div className="intro">
            <div>
              <p className="eyebrow">КАТАЛОГ</p>
              <h2>Лабораторные работы</h2>
            </div>
            <p className="catalog-status" aria-live="polite">
              Показано: <b>{visible.length}</b> из {labs.length}
            </p>
          </div>
          <div className="filters">
            <label className="search">
              <Search aria-hidden="true" />
              <span className="sr-only">Поиск</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Номер, тема или практический результат"
              />
            </label>
            <fieldset className="semester-switch">
              <legend className="sr-only">Фильтр по семестру</legend>
              {[
                ["all", "Все"],
                ["5", "5 семестр"],
                ["6", "6 семестр"],
                ["7", "7 семестр"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={semester === value ? "active" : ""}
                  aria-pressed={semester === value}
                  onClick={() => setSemester(value)}
                >
                  {label}
                </button>
              ))}
            </fieldset>
            <label className="topic-filter">
              <span>Тема</span>
              <select
                value={section}
                onChange={(event) => setSection(event.target.value)}
              >
                <option value="all">Все темы</option>
                {allSections.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid">
            {visible.map((lab) => (
              <LabCard key={lab.id} lab={lab} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

function LabCard({ lab }: { lab: Lab }) {
  return (
    <article className="card">
      <div className="card__meta">
        <span>
          {courseConfig.code} · {lab.id}
        </span>
        <span>
          {lab.semester} семестр · {formatPoints(lab.points)}
        </span>
      </div>
      <p className="card__section">{lab.section}</p>
      <h3>{lab.title}</h3>
      <div className="result">
        <span>Результат</span>
        <p>{lab.artifact}</p>
      </div>
      <div className="card__actions">
        <a className="primary-action" href={`#/lab/${lab.id}`}>
          Открыть работу <ArrowRight aria-hidden="true" />
        </a>
        <a
          className="icon-button"
          href={assetUrl(lab.reportUrl)}
          download
          aria-label={`Скачать шаблон ${lab.id}`}
          title="Скачать шаблон DOCX"
        >
          <Download aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

function LabPage({
  lab,
  variant,
  onVariantChange,
  pageStartRef,
}: {
  lab: Lab;
  variant: Variant;
  onVariantChange: (id: number) => void;
  pageStartRef: React.RefObject<HTMLElement | null>;
}) {
  const [status, setStatus] = useState<"idle" | "busy" | "error">("idle");
  const routeSteps = [
    `Прочитайте паспорт варианта ${variant.code} и выделите факты, относящиеся к работе.`,
    "Отделите подтверждённые факты от вопросов заказчику и проектных допущений.",
    `Соберите артефакт «${lab.artifact}» для системы ${variant.system}.`,
    `Обоснуйте решение с учётом противоречия: ${variant.conflict}.`,
    `Проверьте результат по критерию: ${lab.quality}`,
  ];
  const checks = [
    `Результат соответствует предметной области ${variant.code}.`,
    `Артефакт содержит поля: ${lab.artifact_fields.join(", ")}.`,
    `Решение отвечает на вопрос: ${lab.decision}`,
    `Критерий качества соблюдён: ${lab.quality}`,
    `Типичная ошибка исключена: ${lab.typical_error}`,
  ];
  const download = async () => {
    try {
      setStatus("busy");
      await downloadLabPackage({
        labId: lab.id,
        labTitle: lab.title,
        reportUrl: assetUrl(lab.reportUrl),
        variant,
      });
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };
  return (
    <main className="lab-page" ref={pageStartRef} tabIndex={-1}>
      <a className="skip-link" href="#lab-content">
        К заданию
      </a>
      <nav className="breadcrumbs">
        <a href="#/">
          <ArrowLeft aria-hidden="true" />
          Каталог
        </a>
        <span>/</span>
        <span>{lab.id}</span>
      </nav>
      <section className="lab-hero">
        <p className="eyebrow">
          {lab.course} КУРС · {lab.semester} СЕМЕСТР ·{" "}
          {formatPoints(lab.points)}
        </p>
        <h1>{lab.title}</h1>
        <div className="lab-hero__result">
          <b>Ожидаемый результат</b>
          <span>{lab.artifact}</span>
        </div>
      </section>
      <VariantPicker variant={variant} onChange={onVariantChange} compact />
      <div className="lab-layout" id="lab-content">
        <section className="lab-main">
          <ContentBlock icon={<Layers3 />} title="Учебная ситуация">
            <p>{lab.situation}</p>
            <p>
              <b>Контекст варианта.</b> {variant.process}. Участники:{" "}
              {variant.roles.join(", ")}.
            </p>
          </ContentBlock>
          <ContentBlock icon={<Target />} title="Цель и умение">
            <p>
              <b>Цель.</b> {lab.goal}
            </p>
            <p>
              <b>Умение.</b> {lab.skill}
            </p>
          </ContentBlock>
          <ContentBlock icon={<FileText />} title="Исходные данные">
            <ul>
              {lab.inputs.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>
              <b>Сущности варианта:</b> {variant.objects.join(", ")}.
            </p>
          </ContentBlock>
          <ContentBlock icon={<Route />} title="Порядок выполнения">
            <ol className="task-protocol">
              {routeSteps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
            <aside className="decision-callout">
              <b>Проектное решение</b>
              <p>{lab.decision}</p>
            </aside>
          </ContentBlock>
          <ContentBlock icon={<Lightbulb />} title="Разобранный ориентир">
            <p>{lab.example}</p>
            <p className="note">
              Используйте способ рассуждения, но подставьте данные своего
              варианта.
            </p>
          </ContentBlock>
          <ContentBlock
            icon={<ClipboardCheck />}
            title="Что должно быть получено"
          >
            <p>
              <b>{lab.expected}</b>
            </p>
            <p>
              В редактируемом отчёте должны быть основной артефакт, обоснование
              решения, ссылки на факты варианта и итоговый вывод.
            </p>
          </ContentBlock>
          <ContentBlock icon={<CheckCircle2 />} title="Самопроверка">
            <ul className="checklist">
              {checks.map((item) => (
                <li key={item}>
                  <CheckCircle2 aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </ContentBlock>
          <ContentBlock icon={<BookOpen />} title="Теория">
            <div className="lecture-list">
              {lab.lectures.map((lecture) => (
                <a
                  key={lecture.url}
                  href={lecture.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <b>{lecture.title}</b>
                </a>
              ))}
            </div>
          </ContentBlock>
          <ContentBlock icon={<GraduationCap />} title="Сдача в LMS">
            <p>
              Сдайте один заполненный редактируемый DOCX-файл. Максимум —{" "}
              {formatPoints(lab.points)}.
            </p>
            <a
              className="inline-link"
              href={courseConfig.lmsUrl}
              target="_blank"
              rel="noreferrer"
            >
              Перейти в LMS
            </a>
          </ContentBlock>
        </section>
        <aside className="lab-sidebar">
          <div className="sticky-card">
            <p className="eyebrow">КОМПЛЕКТ РАБОТЫ</p>
            <dl>
              <div>
                <dt>Работа</dt>
                <dd>{lab.id}</dd>
              </div>
              <div>
                <dt>Вариант</dt>
                <dd>
                  {variant.code} · {variant.title}
                </dd>
              </div>
              <div>
                <dt>Результат</dt>
                <dd>{lab.artifact}</dd>
              </div>
            </dl>
            <button
              className="primary-action"
              onClick={download}
              disabled={status === "busy"}
            >
              <Download aria-hidden="true" />
              {status === "busy" ? "Подготовка…" : "Скачать шаблон"}
            </button>
            {status === "error" && (
              <p className="download-error">
                Не удалось собрать ZIP. Обновите страницу и повторите.
              </p>
            )}
            <small>
              ZIP: автономное задание, данные варианта и редактируемый DOCX.
            </small>
          </div>
        </aside>
      </div>
    </main>
  );
}

function ContentBlock({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="content-block">
      <div className="content-block__head">
        <span className="block-icon" aria-hidden="true">
          {icon}
        </span>
        <h2>{title}</h2>
      </div>
      <div className="content-block__body">{children}</div>
    </section>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

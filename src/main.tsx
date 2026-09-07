import { StrictMode, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileText,
  Filter,
  GraduationCap,
  Layers3,
  Lightbulb,
  Route,
  Search,
  Target,
} from 'lucide-react';
import labsData from './labs.json';
import './styles.css';

type Lecture = { title: string; url: string };

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
  input_file: string;
  remember: string[];
  reportUrl: string;
  materialUrl: string;
  lmsUrl: string;
  durationBlocks: number;
  points: number;
};

const labs = labsData as Lab[];
const allSections = [...new Set(labs.map((lab) => lab.section))];
const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
const formatPoints = (points: number) => {
  const noun = points % 10 === 1 && points % 100 !== 11
    ? 'балл'
    : points % 10 >= 2 && points % 10 <= 4 && !(points % 100 >= 12 && points % 100 <= 14)
      ? 'балла'
      : 'баллов';
  return `${points} ${noun}`;
};

function getRoute() {
  const match = window.location.hash.match(/^#\/lab\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function App() {
  const [activeLabId, setActiveLabId] = useState(getRoute);
  const pageStartRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onHashChange = () => setActiveLabId(getRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const lab = labs.find((item) => item.id === activeLabId);
    document.title = lab ? `${lab.id} · ${lab.title}` : 'Лабораторные МДК.05.01';
    window.scrollTo({ top: 0, behavior: 'instant' });
    pageStartRef.current?.focus({ preventScroll: true });
  }, [activeLabId]);

  const activeLab = labs.find((lab) => lab.id === activeLabId);
  return activeLab
    ? <LabPage lab={activeLab} pageStartRef={pageStartRef} />
    : <Catalog pageStartRef={pageStartRef} />;
}

function Catalog({ pageStartRef }: { pageStartRef: React.RefObject<HTMLElement | null> }) {
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState('all');
  const [semester, setSemester] = useState('all');
  const [section, setSection] = useState('all');

  const visible = useMemo(() => labs.filter((lab) => {
    const haystack = `${lab.id} ${lab.title} ${lab.section} ${lab.artifact} ${lab.goal}`.toLocaleLowerCase('ru');
    return (course === 'all' || String(lab.course) === course)
      && (semester === 'all' || String(lab.semester) === semester)
      && (section === 'all' || lab.section === section)
      && haystack.includes(query.trim().toLocaleLowerCase('ru'));
  }), [course, query, section, semester]);

  const resetFilters = () => {
    setQuery('');
    setCourse('all');
    setSemester('all');
    setSection('all');
  };

  return <>
    <a className="skip-link" href="#catalog">К каталогу</a>
    <header className="hero" ref={pageStartRef} tabIndex={-1}>
      <div className="hero__copy">
        <img className="brand" src={assetUrl('brand/synergy-logo.webp')} alt="Университет «Синергия»" />
        <p className="eyebrow">МДК.05.01 · 2026–2027</p>
        <h1>Лабораторные как проектный спринт</h1>
        <p className="lead">От факта заказчика — к решению, артефакту и проверке.</p>
        <div className="metrics" aria-label="Структура курса">
          <span><b>{labs.length}</b> работ</span><span><b>3</b> семестра</span><span><b>100</b> баллов</span>
        </div>
      </div>
      <img className="mascot" src={assetUrl('brand/rhino-designer.webp')} alt="Носорог-проектировщик у доски" />
    </header>
    <main id="catalog" className="catalog">
      <section className="intro" aria-labelledby="catalog-title">
        <div><p className="eyebrow">КАТАЛОГ</p><h2 id="catalog-title">Выберите лабораторную</h2></div>
        <p><BookOpen aria-hidden="true" /> Каждая карточка ведёт к заданию, лекциям и редактируемому шаблону отчёта.</p>
      </section>
      <section className="filters" aria-label="Фильтры каталога">
        <label className="search">
          <Search aria-hidden="true" />
          <span className="sr-only">Поиск</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ID, название или артефакт" />
        </label>
        <div className="filter-row">
          <Filter aria-hidden="true" />
          <label><span>Курс</span><select value={course} onChange={(event) => setCourse(event.target.value)}><option value="all">Все</option><option value="3">3 курс</option><option value="4">4 курс</option></select></label>
          <label><span>Семестр</span><select value={semester} onChange={(event) => setSemester(event.target.value)}><option value="all">Все</option><option value="5">5</option><option value="6">6</option><option value="7">7</option></select></label>
          <label className="section-filter"><span>Раздел</span><select value={section} onChange={(event) => setSection(event.target.value)}><option value="all">Все разделы</option>{allSections.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
      </section>
      <div className="catalog-status" aria-live="polite"><b>{visible.length}</b> из {labs.length} работ</div>
      <section className="grid" aria-label="Лабораторные работы">
        {visible.map((lab) => <LabCard key={lab.id} lab={lab} />)}
      </section>
      {visible.length === 0 && <div className="empty"><p>По заданным фильтрам работ не найдено.</p><button onClick={resetFilters}>Сбросить фильтры</button></div>}
    </main>
    <SiteFooter />
  </>;
}

function LabCard({ lab }: { lab: Lab }) {
  return <article className="card">
    <div className="card__meta"><span>{lab.id}</span><span>{lab.course} курс · {lab.semester} семестр · {formatPoints(lab.points)}</span></div>
    <p className="card__section">{lab.section}</p>
    <h3>{lab.title}</h3>
    <div className="result"><span>Результат</span><p>{lab.artifact}</p></div>
    <div className="card__actions">
      <a className="primary-action" href={`#/lab/${lab.id}`}>Открыть работу <ArrowRight aria-hidden="true" /></a>
      <a className="icon-button" href={assetUrl(lab.reportUrl)} download aria-label={`Скачать шаблон отчёта ${lab.id}`}><Download aria-hidden="true" /></a>
    </div>
  </article>;
}

function LabPage({ lab, pageStartRef }: { lab: Lab; pageStartRef: React.RefObject<HTMLElement | null> }) {
  const routeSteps = [
    `Изучите ситуацию и исходные данные варианта для ${lab.id}.`,
    'Отделите подтверждённые факты от вопросов и допущений.',
    `Соберите черновик артефакта «${lab.artifact}».`,
    `Примите и письменно обоснуйте решение: ${lab.decision}`,
    'Проверьте работу по критерию качества и перенесите результат в шаблон.',
  ];
  const wordSections = [
    'Титульный лист с ID и названием работы',
    'Паспорт результата: цель, ситуация, исходные данные',
    `Основной артефакт и поля: ${lab.artifact_fields.join(', ')}`,
    'Проектное решение и его обоснование',
    'Самопроверка, рефлексия и ссылки на материалы',
  ];
  const checks = [
    `Артефакт соответствует результату: ${lab.expected}`,
    `Решение отвечает на вопрос: ${lab.decision}`,
    `Критерий качества соблюдён: ${lab.quality}`,
    `Нет типичной ошибки: ${lab.typical_error}`,
    'Все поля шаблона заполнены, ссылки открываются, файл готов к загрузке.',
  ];

  return <>
    <a className="skip-link" href="#lab-content">К заданию</a>
    <header className="lab-header" ref={pageStartRef} tabIndex={-1}>
      <nav className="breadcrumbs" aria-label="Навигация"><a href="#/"><ArrowLeft aria-hidden="true" /> Каталог</a><span>/</span><span>{lab.id}</span></nav>
      <div className="lab-header__grid">
        <div>
          <p className="eyebrow">{lab.course} КУРС · {lab.semester} СЕМЕСТР · ЛР {String(lab.number).padStart(2, '0')}</p>
          <h1>{lab.title}</h1>
          <p className="lab-result"><span>Результат работы</span>{lab.artifact}</p>
        </div>
        <div className="quick-actions" aria-label="Материалы работы">
          <a className="primary-action" href={assetUrl(lab.reportUrl)} download><Download aria-hidden="true" />Скачать DOCX</a>
          <a href={lab.materialUrl} target="_blank" rel="noreferrer"><FileText aria-hidden="true" />Исходные данные<ExternalLink aria-hidden="true" /></a>
          <a href={lab.lmsUrl} target="_blank" rel="noreferrer"><GraduationCap aria-hidden="true" />Открыть LMS<ExternalLink aria-hidden="true" /></a>
        </div>
      </div>
    </header>
    <main id="lab-content" className="lab-layout">
      <section className="lab-main">
        <ContentBlock icon={<Layers3 />} kicker="01 · Контекст" title="Ситуация"><p>{lab.situation}</p></ContentBlock>
        <ContentBlock icon={<Target />} kicker="02 · Результат обучения" title="Цель и формируемое умение"><p><b>Цель.</b> {lab.goal}</p><p><b>Умение.</b> {lab.skill}</p></ContentBlock>
        <ContentBlock icon={<Boxes />} kicker="03 · Стартовый пакет" title="Исходные данные"><BulletList items={lab.inputs} /><a className="inline-link" href={lab.materialUrl} target="_blank" rel="noreferrer">Открыть учебный кейс <ExternalLink aria-hidden="true" /></a></ContentBlock>
        <ContentBlock icon={<Lightbulb />} kicker="04 · Перед началом" title="Мини-памятка"><BulletList items={lab.remember.slice(0, 6)} numbered /></ContentBlock>
        <ContentBlock icon={<Route />} kicker="05 · Действия" title="Маршрут выполнения"><BulletList items={routeSteps} numbered /><aside className="decision-callout"><b>Проектное решение</b><p>{lab.decision}</p></aside></ContentBlock>
        <ContentBlock icon={<Lightbulb />} kicker="06 · Ориентир" title="Мини-пример"><p>{lab.example}</p><p className="note">Пример показывает форму рассуждения, но не содержит ответа на учебный кейс.</p></ContentBlock>
        <ContentBlock icon={<FileText />} kicker="07 · Отчёт" title="Что должно быть в Word"><BulletList items={wordSections} /><a className="inline-link" href={assetUrl(lab.reportUrl)} download>Скачать редактируемый шаблон <Download aria-hidden="true" /></a></ContentBlock>
        <ContentBlock icon={<ClipboardCheck />} kicker="08 · Сдача" title="Что проверяется в LMS"><p><b>Максимальный балл.</b> {lab.points}</p><p><b>Ожидаемый результат.</b> {lab.expected}</p><p><b>Ключевой критерий.</b> {lab.quality}</p><p><b>Связь с демонстрационным экзаменом.</b> {lab.demo}</p><p className="note">Загрузите заполненный DOCX в задание своего курса после авторизации.</p><a className="inline-link" href={lab.lmsUrl} target="_blank" rel="noreferrer">Перейти в LMS <ExternalLink aria-hidden="true" /></a></ContentBlock>
        <ContentBlock icon={<CheckCircle2 />} kicker="09 · Перед отправкой" title="Самопроверка"><ul className="checklist">{checks.map((item) => <li key={item}><CheckCircle2 aria-hidden="true" />{item}</li>)}</ul></ContentBlock>
        <ContentBlock icon={<BookOpen />} kicker="10 · Теория" title="Лекции к работе"><div className="lecture-list">{lab.lectures.map((lecture, index) => <a key={lecture.url} href={lecture.url} target="_blank" rel="noreferrer"><span>{String(index + 1).padStart(2, '0')}</span><b>{lecture.title}</b><ExternalLink aria-hidden="true" /></a>)}</div></ContentBlock>
      </section>
      <aside className="lab-sidebar" aria-label="Краткая карточка работы">
        <div className="sticky-card"><p className="eyebrow">КАРТОЧКА РАБОТЫ</p><dl><div><dt>ID</dt><dd>{lab.id}</dd></div><div><dt>Артефакт</dt><dd>{lab.artifact}</dd></div><div><dt>Учебный блок</dt><dd>1</dd></div><div><dt>Максимальный балл</dt><dd>{lab.points}</dd></div></dl><a className="primary-action" href={assetUrl(lab.reportUrl)} download><Download aria-hidden="true" />Скачать шаблон</a><a className="back-link" href="#/"><ArrowLeft aria-hidden="true" />Ко всем работам</a></div>
      </aside>
    </main>
    <SiteFooter />
  </>;
}

function ContentBlock({ icon, kicker, title, children }: { icon: React.ReactNode; kicker: string; title: string; children: React.ReactNode }) {
  return <section className="content-block"><div className="content-block__head"><span className="block-icon" aria-hidden="true">{icon}</span><div><p>{kicker}</p><h2>{title}</h2></div></div><div className="content-block__body">{children}</div></section>;
}

function BulletList({ items, numbered = false }: { items: string[]; numbered?: boolean }) {
  const Tag = numbered ? 'ol' : 'ul';
  return <Tag className={numbered ? 'numbered-list' : 'bullet-list'}>{items.map((item) => <li key={item}>{item}</li>)}</Tag>;
}

function SiteFooter() {
  return <footer className="site-footer"><div><img src={assetUrl('brand/synergy-logo.webp')} alt="" /><p>МДК.05.01 · Проектирование и дизайн информационных систем</p></div><a href="#/">Каталог 20 лабораторных</a></footer>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

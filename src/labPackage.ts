import { strToU8, zipSync } from 'fflate';

type PackageInput = {
  labId: string;
  labTitle: string;
  reportUrl: string;
  variant: { code: string; title: string; system: string; roles: string[]; objects: string[]; process: string; conflict: string };
};

const fetchBytes = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Не удалось получить шаблон: ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
};

export async function downloadLabPackage({ labId, labTitle, reportUrl, variant }: PackageInput) {
  const report = await fetchBytes(reportUrl);
  const page = document.querySelector<HTMLElement>('.lab-page')?.cloneNode(true) as HTMLElement | undefined;
  if (!page) throw new Error('Страница лабораторной работы не найдена');
  page.querySelectorAll('button, .site-header, .breadcrumbs, .lab-hero').forEach((element) => element.remove());
  page.querySelectorAll('select').forEach((select) => {
    const value = document.createElement('strong');
    value.textContent = (select as HTMLSelectElement).selectedOptions[0]?.textContent || variant.code;
    select.replaceWith(value);
  });
  const css = await Promise.all(Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).map(async (link) => {
    const response = await fetch(link.href);
    return response.ok ? response.text() : '';
  }));
  const html = `<!doctype html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${labId} · ${variant.code}</title><style>${css.join('\n')}body{background:#fff}.lab-page{padding-top:1rem}.lab-layout{grid-template-columns:1fr}.lab-sidebar{display:none}</style></head><body>${page.outerHTML}</body></html>`;
  const source = `# ${variant.code} · ${variant.title}\n\nСистема: ${variant.system}\n\n## Сквозной процесс\n${variant.process}.\n\n## Роли\n${variant.roles.map((x) => `- ${x}`).join('\n')}\n\n## Сущности-кандидаты\n${variant.objects.map((x) => `- ${x}`).join('\n')}\n\n## Проектное противоречие\n${variant.conflict}.\n\n## Лабораторная работа\n${labId} · ${labTitle}. Все решения этой работы должны быть трассируемы к приведённым данным варианта.\n`;
  const archive = zipSync({
    [`${labId}_${variant.code}.html`]: strToU8(html),
    [`Исходные_данные/${variant.code}_${labId}.md`]: strToU8(source),
    [`Шаблон_отчёта/${labId}_template.docx`]: report,
  }, { level: 6 });
  const href = URL.createObjectURL(new Blob([archive], { type: 'application/zip' }));
  const link = document.createElement('a');
  link.href = href;
  link.download = `${variant.code}_${labId}_комплект.zip`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}

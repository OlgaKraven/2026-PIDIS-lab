from pathlib import Path
import json,zipfile,csv,io,hashlib,re
from lxml import html
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'src/data/variant-data.json').read_text(encoding='utf8'))
result=[]
for archive in sorted((root/'output/browser').glob('*.zip')):
 count=0
 with zipfile.ZipFile(archive) as z:
  for name in z.namelist():
   if not name.endswith('Начните_здесь.html'):continue
   raw=z.read(name).decode('utf8');soup=html.fromstring(raw)
   lab=re.search(r'C[34]-S[567]-LR\d{2}',soup.xpath('//h1')[0].text_content()).group();variant=int(re.search(r'PV(\d+)',soup.xpath('//*[@class="offline-variant"]')[0].text_content()).group(1))
   prefix=name[:-len('Начните_здесь.html')]
   for i,section in enumerate(data[lab][str(variant)]):
    rows=list(csv.reader(io.StringIO(z.read(prefix+f'Данные/Данные_{i+1:02}.csv').decode('utf-8-sig')),delimiter=';'))
    expected=[section['table']['columns']]+[[str(v) for v in row]for row in section['table']['rows']]
    assert rows==expected,(archive.name,name,i)
    actual=[[c.text_content()for c in tr.xpath('./th|./td')]for tr in soup.xpath('//*[@id="inputs"]//table')[i].xpath('.//tr')]
    assert actual==expected,(archive.name,name,'HTML')
   assert z.read(prefix+'Шаблон_для_заполнения.docx')==(root/f'public/reports/{lab}.docx').read_bytes()
   assert not re.search(r'plannedMinutes|teacher_answer|PISID[34]-lecture|Время выполнения',raw)
   assert not soup.xpath('//details[not(@open)]')
   count+=1
 result.append({'archive':archive.name,'sets':count,'csvHtmlDocx':'identical','sha256':hashlib.sha256(archive.read_bytes()).hexdigest()})
(root/'quality/archives.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(result,ensure_ascii=False))

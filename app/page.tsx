'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Check, ChevronRight, Copy, ImagePlus, Palette, RotateCcw, ShieldCheck, Sparkles, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ColorResult = { hex: string; rgb: string; name: string; percent: number; count: number };

const COLOR_NAMES = [
  ['Preto', 0, 0, 0], ['Grafite', 54, 57, 63], ['Cinza', 128, 128, 128], ['Prata', 192, 192, 192],
  ['Branco', 250, 250, 250], ['Vermelho', 220, 38, 38], ['Vinho', 128, 0, 32], ['Coral', 255, 111, 97],
  ['Laranja', 249, 115, 22], ['Âmbar', 245, 158, 11], ['Amarelo', 250, 204, 21], ['Creme', 255, 253, 208],
  ['Verde-limão', 132, 204, 22], ['Verde', 22, 163, 74], ['Esmeralda', 5, 150, 105], ['Oliva', 128, 128, 0],
  ['Menta', 110, 231, 183], ['Turquesa', 20, 184, 166], ['Ciano', 6, 182, 212], ['Azul-celeste', 56, 189, 248],
  ['Azul', 37, 99, 235], ['Azul-marinho', 30, 58, 138], ['Índigo', 79, 70, 229], ['Violeta', 124, 58, 237],
  ['Roxo', 147, 51, 234], ['Magenta', 217, 70, 239], ['Rosa', 236, 72, 153], ['Rosa-claro', 251, 207, 232],
  ['Marrom', 120, 72, 48], ['Caramelo', 180, 120, 65], ['Bege', 222, 202, 168], ['Dourado', 212, 175, 55],
] as const;

function nearestName(r: number, g: number, b: number) {
  let winner = COLOR_NAMES[0]; let distance = Infinity;
  for (const item of COLOR_NAMES) {
    const next = (r - item[1]) ** 2 + (g - item[2]) ** 2 + (b - item[3]) ** 2;
    if (next < distance) { winner = item; distance = next; }
  }
  return winner[0];
}

function toHex(value: number) { return value.toString(16).padStart(2, '0').toUpperCase(); }

function analyzeImage(image: HTMLImageElement, limit: number): ColorResult[] {
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, 540 / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return [];
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const histogram = new Map<string, { r: number; g: number; b: number; count: number }>();
  let total = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 120) continue;
    const r = Math.min(Math.round(pixels[i] / 16) * 16, 255);
    const g = Math.min(Math.round(pixels[i + 1] / 16) * 16, 255);
    const b = Math.min(Math.round(pixels[i + 2] / 16) * 16, 255);
    const key = `${r},${g},${b}`; const current = histogram.get(key);
    if (current) current.count += 1; else histogram.set(key, { r, g, b, count: 1 });
    total += 1;
  }
  const candidates = [...histogram.values()].sort((a, b) => b.count - a.count);
  const selected: typeof candidates = [];
  for (const color of candidates) {
    const similar = selected.find((picked) => (picked.r-color.r) ** 2 + (picked.g-color.g) ** 2 + (picked.b-color.b) ** 2 < 34 ** 2);
    if (similar) similar.count += color.count; else if (selected.length < limit) selected.push({ ...color });
    if (selected.length >= limit && selected.reduce((sum, item) => sum + item.count, 0) > total * .9) break;
  }
  const visibleTotal = selected.reduce((sum, color) => sum + color.count, 0);
  return selected.sort((a,b) => b.count-a.count).map(({ r,g,b,count }) => ({
    hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`, rgb: `${r}, ${g}, ${b}`, name: nearestName(r,g,b), percent: count/visibleTotal*100, count,
  }));
}

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null); const [fileName, setFileName] = useState('');
  const [colors, setColors] = useState<ColorResult[]>([]); const [limit, setLimit] = useState(12);
  const [dragging, setDragging] = useState(false); const [copied, setCopied] = useState('');
  const imageRef = useRef<HTMLImageElement>(null); const inputRef = useRef<HTMLInputElement>(null);
  const processFile = useCallback((file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file)); setFileName(file.name); setColors([]);
  }, [imageUrl]);
  const onImageReady = () => { if (imageRef.current) setColors(analyzeImage(imageRef.current, limit)); };
  const rerun = (next: number) => { setLimit(next); if (imageRef.current?.complete) setColors(analyzeImage(imageRef.current, next)); };
  const copy = async (hex: string) => { await navigator.clipboard.writeText(hex); setCopied(hex); window.setTimeout(() => setCopied(''), 1400); };
  const gradient = useMemo(() => colors.length ? `linear-gradient(90deg, ${colors.map((c,i) => `${c.hex} ${i*100/colors.length}% ${(i+1)*100/colors.length}%`).join(', ')})` : 'linear-gradient(90deg,#7950f2,#ff6b9d,#ffc857,#3ecf8e)', [colors]);

  return <main className="min-h-screen overflow-hidden">
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Croma, início"><span className="brand-mark"><Palette size={20}/></span><span>Croma</span></a>
      <div className="privacy-note"><ShieldCheck size={15}/> Sua imagem não sai do dispositivo</div>
    </header>
    <section id="top" className="intro">
      <div className="eyebrow"><Sparkles size={14}/> Leitor inteligente de cores</div>
      <h1>Descubra as cores<br/>que vivem na sua imagem.</h1>
      <p>Envie uma foto, ilustração ou logo. Em instantes, veja a paleta principal, o nome de cada cor e seus códigos exatos.</p>
    </section>
    <section className="workspace" aria-label="Analisador de cores">
      {!imageUrl ? <div className={`dropzone ${dragging?'is-dragging':''}`}
        onDragEnter={(e)=>{e.preventDefault();setDragging(true)}} onDragOver={(e)=>e.preventDefault()} onDragLeave={()=>setDragging(false)}
        onDrop={(e)=>{e.preventDefault();setDragging(false);processFile(e.dataTransfer.files[0])}}>
        <div className="upload-icon"><ImagePlus size={30}/></div><h2>Solte sua imagem aqui</h2><p>ou escolha um arquivo do seu dispositivo</p>
        <Button size="lg" onClick={()=>inputRef.current?.click()} className="upload-button"><Upload data-icon="inline-start"/> Escolher imagem</Button>
        <small>PNG, JPG, WEBP ou GIF · até 20 MB</small>
        <input ref={inputRef} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e)=>processFile(e.target.files?.[0])}/>
      </div> : <div className="results-layout">
        <aside className="image-panel">
          <div className="panel-heading"><div><span>Imagem analisada</span><strong>{fileName}</strong></div><Button variant="outline" size="sm" onClick={()=>inputRef.current?.click()}><RotateCcw/> Trocar</Button></div>
          <div className="image-frame"><img ref={imageRef} src={imageUrl} alt="Imagem enviada para análise" onLoad={onImageReady}/></div>
          <div className="palette-strip" style={{background:gradient}}/>
          <div className="range-row"><label htmlFor="color-count"><span>Número de cores</span><b>{limit}</b></label><input id="color-count" type="range" min="4" max="24" value={limit} onChange={(e)=>rerun(Number(e.target.value))}/></div>
          <input ref={inputRef} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e)=>processFile(e.target.files?.[0])}/>
        </aside>
        <div className="colors-panel">
          <div className="results-heading"><div><span className="result-kicker">Paleta encontrada</span><h2>{colors.length||'—'} cores principais</h2></div><span className="ready-pill"><Check size={13}/> Análise concluída</span></div>
          <div className="color-list">{colors.map((color,index)=><article className="color-card" key={`${color.hex}-${index}`}>
            <div className="swatch" style={{backgroundColor:color.hex}}/><div className="color-info">
              <div className="color-name-row"><h3>{color.name}</h3><span>{color.percent.toFixed(1)}%</span></div>
              <div className="color-meta"><button onClick={()=>copy(color.hex)} aria-label={`Copiar ${color.hex}`}>{color.hex} {copied===color.hex?<Check size={13}/>:<Copy size={13}/>}</button><span>RGB {color.rgb}</span></div>
              <div className="share-bar"><span style={{width:`${Math.max(color.percent,2)}%`,backgroundColor:color.hex}}/></div>
            </div><ChevronRight className="color-arrow" size={17}/></article>)}</div>
        </div>
      </div>}
    </section>
    <footer><span>Croma identifica as cores dominantes por aproximação visual.</span><span>Processamento 100% local</span></footer>
  </main>;
}

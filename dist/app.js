const starter=String.raw`\documentclass{article}
\usepackage{graphicx}
\usepackage{amsmath}

\title{A Small Study of Reliable Evidence}
\author{Student Name}
\date{October 23, 2026}

\begin{document}
\maketitle

\section{Introduction}
This document is ready to become your paper. Edit the source,
then compile to update the preview.

\begin{figure}[h]
  \centering
  \includegraphics[width=.65\linewidth]{figures/diagram.png}
  \caption{A simple evidence pipeline.}
\end{figure}

\section{Method}
We compare independent observations and report uncertainty explicitly.
\[
  P(H \mid E) \propto P(E \mid H)P(H)
\]

\section{Conclusion}
The result is reproducible when the source, data, and assumptions
remain traceable.

\bibliographystyle{plain}
\bibliography{references}
\end{document}`;
const files={
  "main.tex":localStorage.getItem("texwell-main")||starter,
  "references.bib":`@article{shannon1948,\n  title={A Mathematical Theory of Communication},\n  author={Shannon, Claude E.},\n  journal={Bell System Technical Journal},\n  year={1948}\n}`,
  "notes.tex":`% Private notes for this assignment\n% Try one change at a time, then compile.`,
  "diagram.png":"[Binary image preview]\n\nA → observe → B → compare → C"
};
const editor=document.querySelector("#sourceEditor"),lines=document.querySelector("#lineNumbers"),saveState=document.querySelector("#saveState"),compileBtn=document.querySelector("#compileBtn"),progress=document.querySelector("#compileProgress"),pdfView=document.querySelector("#pdfView"),logView=document.querySelector("#logView"),pdfTab=document.querySelector("#pdfTab"),logTab=document.querySelector("#logTab"),toast=document.querySelector("#toast");
let activeFile="main.tex",zoom=92,saveTimer;
editor.value=files[activeFile];
function updateLines(){lines.textContent=Array.from({length:Math.max(1,editor.value.split("\n").length)},(_,i)=>i+1).join("\n")}
function cursor(){const pos=editor.selectionStart,before=editor.value.slice(0,pos),row=before.split("\n").length,col=pos-before.lastIndexOf("\n");document.querySelector("#cursorPosition").textContent=`Ln ${row}, Col ${col}`;const rowText=before.split("\n").at(-1)||"";const guide=rowText.includes("section")?["Sections","Sections organize your argument. LaTeX numbers them automatically."]:rowText.includes("begin{figure}")?["Figures","Place the image, caption, and label together so references stay correct."]:rowText.includes("usepackage")?["Packages","Packages add capabilities. Load them in the preamble before \\begin{document}."]:["Document setup","The preamble chooses the document type and loads packages before your content begins."];document.querySelector("#guideTitle").textContent=guide[0];document.querySelector("#guideCopy").textContent=guide[1]}
function save(){files[activeFile]=editor.value;if(activeFile==="main.tex")localStorage.setItem("texwell-main",editor.value);saveState.textContent="Saving…";clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveState.textContent="All changes saved locally",500);updateLines();cursor()}
editor.addEventListener("input",save);editor.addEventListener("click",cursor);editor.addEventListener("keyup",cursor);editor.addEventListener("scroll",()=>lines.scrollTop=editor.scrollTop);
editor.addEventListener("keydown",e=>{if(e.key==="Tab"){e.preventDefault();const s=editor.selectionStart;editor.setRangeText("  ",s,editor.selectionEnd,"end");save()}if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();compile()}});
function valueOf(command,source){const escaped=command.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return source.match(new RegExp("\\\\"+escaped+"\\{([^}]*)\\}"))?.[1]}
function textSections(source){return [...source.matchAll(/\\section\{([^}]*)\}([\s\S]*?)(?=\\section\{|\\bibliography|\\end\{document\})/g)].map(m=>({title:m[1],body:m[2].replace(/\\begin\{figure\}[\s\S]*?\\end\{figure\}/g,"").replace(/\\\[[\s\S]*?\\\]/g,"").replace(/\\[a-zA-Z]+(?:\[[^\]]*\])?\{([^}]*)\}/g,"$1").replace(/%.*$/gm,"").replace(/\s+/g," ").trim()}))}
function render(source){const title=valueOf("title",source)||"Untitled document",author=valueOf("author",source)||"Anonymous",date=valueOf("date",source)||"";document.querySelector("#paperTitle").textContent=title;document.querySelector("#paperAuthor").textContent=author;document.querySelector(".paper-date").textContent=date;const sections=textSections(source),paper=document.querySelector("#paper");paper.querySelectorAll("h2, p:not(.paper-date):not(.page-number), .paper-figure").forEach(n=>n.remove());sections.forEach((s,i)=>{const h=document.createElement("h2");h.textContent=`${i+1}  ${s.title}`;const p=document.createElement("p");p.textContent=s.body||"Add text for this section in the source editor.";paper.insertBefore(h,paper.querySelector(".page-number"));paper.insertBefore(p,paper.querySelector(".page-number"))})}
function diagnose(source){const opens=(source.match(/\\begin\{/g)||[]).length,closes=(source.match(/\\end\{/g)||[]).length;if(opens!==closes)return{line:source.split("\n").findIndex(x=>x.includes("\\begin{"))+1,title:"An environment was not closed.",explain:"LaTeX found a \\begin{...} without a matching \\end{...}. Add the closing command before the document ends.",raw:"! LaTeX Error: \\begin ended by \\end{document}."};if(!source.includes("\\begin{document}"))return{line:1,title:"The document body is missing.",explain:"Add \\begin{document} before your paper content and \\end{document} at the end.",raw:"! LaTeX Error: Missing \\begin{document}."};if((source.match(/\{/g)||[]).length!==(source.match(/\}/g)||[]).length)return{line:1,title:"A curly brace is unmatched.",explain:"One command has an opening { without its closing }. Check the most recent title, section, citation, or formatting command.",raw:"! Runaway argument? File ended while scanning use of command."};return null}
function showView(view){const isPdf=view==="pdf";pdfView.hidden=!isPdf;logView.hidden=isPdf;pdfTab.classList.toggle("active",isPdf);logTab.classList.toggle("active",!isPdf);pdfTab.setAttribute("aria-selected",isPdf);logTab.setAttribute("aria-selected",!isPdf)}
function compile(){if(activeFile!=="main.tex")selectFile("main.tex");compileBtn.classList.add("busy");compileBtn.lastChild.textContent=" Compiling…";progress.classList.add("active");setTimeout(()=>{const issue=diagnose(editor.value);progress.classList.remove("active");compileBtn.classList.remove("busy");compileBtn.innerHTML='<span aria-hidden="true">▶</span> Compile PDF <kbd>Ctrl ↵</kbd>';const count=document.querySelector("#issueCount"),summary=document.querySelector("#logSummary"),jump=document.querySelector("#jumpToIssue");if(issue){count.textContent="1";count.classList.add("has-issue");summary.className="log-summary error";summary.innerHTML="<span>!</span><div><strong>Compilation stopped</strong><small>1 issue needs attention</small></div>";document.querySelector("#logTitle").textContent=issue.title;document.querySelector("#logExplanation").textContent=issue.explain;document.querySelector("#rawLog").textContent=issue.raw;rootIssue=issue;jump.hidden=false;document.querySelector("#healthText").textContent="1 issue to fix";document.querySelector("#healthText").style.color="#d85146";document.querySelector("#healthMeter").style.width="38%";document.querySelector("#healthMeter").style.background="#ef6a5b";showView("log");notify("Compilation paused — the guide explains the issue") }else{render(editor.value);count.textContent="0";count.classList.remove("has-issue");summary.className="log-summary success";summary.innerHTML="<span>✓</span><div><strong>Compilation successful</strong><small>PDF produced in 0.8 seconds</small></div>";document.querySelector("#logTitle").textContent="Everything looks good.";document.querySelector("#logExplanation").textContent="No errors were found. Warnings will appear here with a plain-language explanation and a suggested fix.";document.querySelector("#rawLog").textContent="This is pdfTeX, Version 3.141592653\nentering extended mode\n(./main.tex\nOutput written on main.pdf (1 page).\nTranscript written on main.log.";jump.hidden=true;document.querySelector("#healthText").textContent="Compiled successfully";document.querySelector("#healthText").style.color="";document.querySelector("#healthMeter").style.width="100%";document.querySelector("#healthMeter").style.background="";showView("pdf");notify("PDF updated successfully")}},760)}
let rootIssue=null;compileBtn.addEventListener("click",compile);pdfTab.addEventListener("click",()=>showView("pdf"));logTab.addEventListener("click",()=>showView("log"));
function selectFile(name){if(name==="figures")return;files[activeFile]=editor.value;activeFile=name;editor.value=files[name]||"";document.querySelector("#activeFileName").textContent=name;document.querySelectorAll(".tree-row").forEach(b=>b.classList.toggle("active",b.dataset.file===name));editor.readOnly=name==="diagram.png";updateLines();cursor();document.querySelector(".file-panel").classList.remove("open")}
document.querySelectorAll(".tree-row").forEach(b=>b.addEventListener("click",()=>selectFile(b.dataset.file)));
function notify(message){toast.textContent=message;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),2200)}
document.querySelector("#wrapBtn").addEventListener("click",e=>{const pressed=e.currentTarget.getAttribute("aria-pressed")==="true";e.currentTarget.setAttribute("aria-pressed",!pressed);editor.style.whiteSpace=pressed?"pre":"pre-wrap"});
document.querySelector("#guideBtn").addEventListener("click",e=>{const g=document.querySelector("#learningGuide"),shown=!g.classList.contains("hidden");g.classList.toggle("hidden",shown);e.currentTarget.setAttribute("aria-pressed",!shown);e.currentTarget.textContent=shown?"Guide off":"Guide on"});
document.querySelector("#closeGuide").addEventListener("click",()=>{document.querySelector("#learningGuide").classList.add("hidden");document.querySelector("#guideBtn").setAttribute("aria-pressed","false");document.querySelector("#guideBtn").textContent="Guide off"});
document.querySelector("#insertExample").addEventListener("click",()=>{const text="\n\\section{New section}\nExplain your idea here and cite supporting evidence.\n";editor.setRangeText(text,editor.selectionStart,editor.selectionEnd,"end");save();notify("Example inserted")});
document.querySelector("#jumpToIssue").addEventListener("click",()=>{showView("pdf");editor.focus();const target=Math.max(0,(rootIssue?.line||1)-1),pos=editor.value.split("\n").slice(0,target).join("\n").length+(target?1:0);editor.setSelectionRange(pos,pos);cursor()});
document.querySelector("#zoomIn").addEventListener("click",()=>setZoom(zoom+8));document.querySelector("#zoomOut").addEventListener("click",()=>setZoom(zoom-8));function setZoom(n){zoom=Math.min(124,Math.max(68,n));document.querySelector("#zoomLabel").textContent=zoom+"%";document.querySelector("#paper").style.transform=`scale(${zoom/92})`}
document.querySelector("#downloadBtn").addEventListener("click",()=>notify("PDF download will connect to the compiler service"));document.querySelector("#newFileBtn").addEventListener("click",()=>notify("New-file workflow is ready for the next prototype round"));document.querySelector(".mobile-files").addEventListener("click",()=>document.querySelector(".file-panel").classList.toggle("open"));
const dialog=document.querySelector("#shareDialog");document.querySelector("#shareBtn").addEventListener("click",()=>dialog.showModal());document.querySelector(".dialog-close").addEventListener("click",()=>dialog.close());document.querySelector(".fake-input button").addEventListener("click",()=>{dialog.close();notify("Prototype invite created")});
updateLines();cursor();render(editor.value);

import {
    normalizarDados,
    gerarIdUnico,
    hojeISO,
    diasDesde
} from "./logica.js";

const VERSAO_APP = "0.5.0-beta";
const CHAVE_STORAGE = "treinoAppState";
const CHAVE_ULTIMO_BACKUP = "treinoAppUltimoBackup";
const DIAS_PARA_LEMBRAR_BACKUP = 14;
const TAMANHO_MAX_IMPORT = 2 * 1024 * 1024; // 2MB

const SECAO_COM_CARGA = "Exercícios";

const ICONE_LIXEIRA = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>`;
const ICONE_CHEVRON = `<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

const DADOS_PADRAO = {
    titulo: "Plano de Treino",
    objetivo: "",
    dias: [
        {
            dia: "Segunda-feira",
            classe: "seg",
            secoes: [
                { titulo:"Exercícios", itens:[
                    { id:"exercicio-segunda", nome:"Exercício", reps:"3x12" }
                ]}
            ]
        },
        {
            dia: "Terça-feira",
            classe: "ter",
            secoes: [
                { titulo:"Exercícios", itens:[
                    { id:"exercicio-terca", nome:"Exercício", reps:"3x12" }
                ]}
            ]
        },
        {
            dia: "Quarta-feira",
            classe: "qua",
            secoes: [
                { titulo:"Exercícios", itens:[
                    { id:"exercicio-quarta", nome:"Exercício", reps:"3x12" }
                ]}
            ]
        },
        {
            dia: "Quinta-feira",
            classe: "qui",
            secoes: [
                { titulo:"Exercícios", itens:[
                    { id:"exercicio-quinta", nome:"Exercício", reps:"3x12" }
                ]}
            ]
        },
        {
            dia: "Sexta-feira",
            classe: "sex",
            secoes: [
                { titulo:"Exercícios", itens:[
                    { id:"exercicio-sexta", nome:"Exercício", reps:"3x12" }
                ]}
            ]
        },
        {
            dia: "Sábado",
            classe: "sab",
            secoes: [
                { titulo:"Exercícios", itens:[
                    { id:"exercicio-sabado", nome:"Exercício", reps:"3x12" }
                ]}
            ]
        },
        {
            dia: "Domingo",
            classe: "dom",
            secoes: [
                { titulo:"Exercícios", itens:[
                    { id:"exercicio-domingo", nome:"Exercício", reps:"3x12" }
                ]}
            ]
        }
    ]
};

function carregarEstado(){
    const salvo = localStorage.getItem(CHAVE_STORAGE);
    if(salvo){
        try{ return normalizarDados(JSON.parse(salvo)); }
        catch(e){ console.warn("Estado salvo inválido, usando padrão.", e); }
    }
    return normalizarDados(DADOS_PADRAO);
}

function salvarEstado(){
    try{
        localStorage.setItem(CHAVE_STORAGE, JSON.stringify(estado));
    }catch(e){
        console.warn("Falha ao salvar no localStorage:", e);
        mostrarToast("Não foi possível salvar — armazenamento indisponível ou cheio.", "erro");
    }
}

let estado = carregarEstado();

// Estado de interface (não persistido): o que está expandido/em edição agora.
let diaExpandido = null;
let diaEditandoNome = null;
let editandoTitulo = false;
let editandoObjetivo = false;
let itemEditando = null; // "di-si-ii" ou null

function renderizar(){
    document.title = (estado.titulo || "Plano de Treino").replace(/[^\w\sÀ-ÿ()\-–—.,'"!?:/+]/g,"").trim() || "Plano de Treino";
    renderizarHeader();
    renderizarDias();
    atualizarAvisoBackup();
}

function renderizarHeader(){
    const headerTitulo = document.getElementById("headerTitulo");
    const headerObjetivo = document.getElementById("headerObjetivo");

    if(editandoTitulo){
        headerTitulo.innerHTML = `<input type="text" id="campoTitulo" value="${escapeAttr(estado.titulo)}">`;
        const input = document.getElementById("campoTitulo");
        input.addEventListener("keydown", e=>{
            if(e.key === "Enter") input.blur();
            if(e.key === "Escape"){ editandoTitulo = false; renderizarHeader(); }
        });
        input.addEventListener("blur", () => {
            if(!editandoTitulo) return;
            estado.titulo = input.value.trim() || "Plano de Treino";
            editandoTitulo = false;
            salvarEstado();
            renderizarHeader();
        });
        input.focus();
        input.select();
    } else {
        headerTitulo.innerHTML = `<h1 class="editavel" id="tituloTexto">${escapeHtml(estado.titulo)}</h1>`;
        document.getElementById("tituloTexto").addEventListener("dblclick", () => {
            editandoTitulo = true;
            renderizarHeader();
        });
    }

    if(editandoObjetivo){
        headerObjetivo.innerHTML = `
            <strong>Objetivo:</strong>
            <textarea id="campoObjetivo" rows="3" placeholder="Ex: ganhar força, emagrecer, manter a constância...">${escapeHtml(estado.objetivo)}</textarea>
        `;
        const textarea = document.getElementById("campoObjetivo");
        textarea.addEventListener("keydown", e=>{
            if(e.key === "Escape"){ editandoObjetivo = false; renderizarHeader(); }
        });
        textarea.addEventListener("blur", () => {
            if(!editandoObjetivo) return;
            estado.objetivo = textarea.value.trim();
            editandoObjetivo = false;
            salvarEstado();
            renderizarHeader();
        });
        textarea.focus();
    } else {
        headerObjetivo.innerHTML = estado.objetivo
            ? `<strong>Objetivo:</strong> <span class="editavel" id="objetivoTexto">${escapeHtml(estado.objetivo)}</span>`
            : `<span class="editavel objetivo-vazio" id="objetivoTexto">Toque duas vezes para definir um objetivo</span>`;
        document.getElementById("objetivoTexto").addEventListener("dblclick", () => {
            editandoObjetivo = true;
            renderizarHeader();
        });
    }
}

function renderizarDias(){
    const container = document.getElementById("dias");
    container.innerHTML = "";

    estado.dias.forEach((treino, di) => {
        const aberto = di === diaExpandido;
        const card = document.createElement("div");
        card.className = `card ${treino.classe || ""}${aberto ? " aberto" : ""}`;

        const nomeDiaHtml = diaEditandoNome === di
            ? `<input type="text" class="campo-dia-nome" value="${escapeAttr(treino.dia)}">`
            : `<span class="dia-nome editavel">${escapeHtml(treino.dia)}</span>`;

        let html = `<div class="titulo" data-dia="${di}" role="button" tabindex="0" aria-expanded="${aberto}">${nomeDiaHtml}${ICONE_CHEVRON}</div>`;
        html += `<div class="conteudo">`;

        treino.secoes.forEach((secao, si) => {
            const numerar = secao.itens.length > 1;
            html += `<div class="secao">`;
            html += `<div class="secao-head"><span class="secao-titulo">${escapeHtml(secao.titulo)}</span><div class="secao-linha"></div></div>`;
            html += `<ul>`;

            secao.itens.forEach((item, ii) => {
                const chave = `${di}-${si}-${ii}`;
                if(itemEditando === chave){
                    html += `
                        <li data-dia="${di}" data-secao="${si}" data-item="${ii}">
                            <div class="linha-edicao">
                                <input type="text" class="nome campo-nome" value="${escapeAttr(item.nome)}">
                                <input type="text" class="reps campo-reps" value="${escapeAttr(item.reps)}">
                                <button type="button" class="excluir" title="Excluir exercício">${ICONE_LIXEIRA}</button>
                            </div>
                        </li>
                    `;
                } else {
                    const numeroHtml = numerar ? `<span class="numero">${ii + 1}</span>` : "";
                    html += `
                        <li data-dia="${di}" data-secao="${si}" data-item="${ii}">
                            <div class="item-principal linha-editavel">
                                ${numeroHtml}
                                <span class="item-nome">${escapeHtml(item.nome)}</span>
                                <span class="badge">${escapeHtml(item.reps)}</span>
                            </div>
                        </li>
                    `;
                }
            });

            html += `</ul></div>`;
        });

        let indiceSecaoAlvo = treino.secoes.findIndex(s => s.titulo === SECAO_COM_CARGA);
        if(indiceSecaoAlvo === -1) indiceSecaoAlvo = treino.secoes.length - 1;
        html += `<button type="button" class="add-exercicio" data-dia="${di}" data-secao="${indiceSecaoAlvo}">+ Adicionar exercício</button>`;

        html += `</div>`;
        card.innerHTML = html;
        container.appendChild(card);
    });

    ligarEventosDias(container);
}

function ligarEventosDias(container){
    container.querySelectorAll(".titulo").forEach(tituloEl=>{
        const di = Number(tituloEl.dataset.dia);

        const alternar = () => {
            if(diaEditandoNome === di) return;
            diaExpandido = (diaExpandido === di) ? null : di;
            renderizar();
        };

        tituloEl.addEventListener("click", alternar);
        tituloEl.addEventListener("keydown", e=>{
            if(e.key === "Enter" || e.key === " "){
                e.preventDefault();
                alternar();
            }
        });

        const nomeEl = tituloEl.querySelector(".dia-nome");
        if(nomeEl){
            nomeEl.addEventListener("dblclick", e=>{
                e.stopPropagation();
                diaEditandoNome = di;
                renderizar();
            });
        }

        const inputNome = tituloEl.querySelector(".campo-dia-nome");
        if(inputNome){
            inputNome.addEventListener("click", e=> e.stopPropagation());
            inputNome.addEventListener("keydown", e=>{
                if(e.key === "Enter") inputNome.blur();
                if(e.key === "Escape"){ diaEditandoNome = null; renderizar(); }
            });
            inputNome.addEventListener("blur", () => {
                if(diaEditandoNome !== di) return;
                estado.dias[di].dia = inputNome.value.trim() || estado.dias[di].dia;
                diaEditandoNome = null;
                salvarEstado();
                renderizar();
            });
            inputNome.focus();
            inputNome.select();
        }
    });

    container.querySelectorAll(".item-principal.linha-editavel").forEach(el=>{
        el.addEventListener("dblclick", () => {
            const li = el.closest("li");
            itemEditando = `${li.dataset.dia}-${li.dataset.secao}-${li.dataset.item}`;
            renderizar();
        });
    });

    container.querySelectorAll("li .linha-edicao").forEach(linha=>{
        const li = linha.closest("li");
        const { dia, secao, item } = li.dataset;
        const chave = `${dia}-${secao}-${item}`;
        const nomeInput = linha.querySelector(".campo-nome");
        const repsInput = linha.querySelector(".campo-reps");

        function commit(){
            if(itemEditando !== chave) return;
            estado.dias[dia].secoes[secao].itens[item].nome = nomeInput.value.trim();
            estado.dias[dia].secoes[secao].itens[item].reps = repsInput.value.trim();
            itemEditando = null;
            salvarEstado();
            renderizar();
        }

        [nomeInput, repsInput].forEach(input=>{
            input.addEventListener("keydown", e=>{
                if(e.key === "Enter") input.blur();
                if(e.key === "Escape"){ itemEditando = null; renderizar(); }
            });
        });

        li.addEventListener("focusout", e=>{
            if(itemEditando !== chave) return;
            if(li.contains(e.relatedTarget)) return;
            commit();
        });

        linha.querySelector(".excluir").addEventListener("click", () => {
            estado.dias[dia].secoes[secao].itens.splice(item, 1);
            itemEditando = null;
            salvarEstado();
            renderizar();
        });

        nomeInput.focus();
        nomeInput.select();
    });

    container.querySelectorAll(".add-exercicio").forEach(btn=>{
        btn.addEventListener("click", e=>{
            const { dia, secao } = e.currentTarget.dataset;
            const idsExistentes = new Set();
            estado.dias.forEach(d=>d.secoes.forEach(s=>s.itens.forEach(it=>idsExistentes.add(it.id))));
            const novoId = gerarIdUnico("Novo exercício", idsExistentes);
            const lista = estado.dias[dia].secoes[secao].itens;
            lista.push({ id: novoId, nome:"Novo exercício", reps:"3x10" });
            salvarEstado();
            itemEditando = `${dia}-${secao}-${lista.length - 1}`;
            renderizar();
        });
    });
}

function escapeHtml(texto){
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

function escapeAttr(texto){
    return escapeHtml(texto).replace(/"/g,"&quot;");
}

function mostrarToast(mensagem, tipo){
    const toast = document.createElement("div");
    toast.className = `toast${tipo === "erro" ? " erro" : ""}`;
    toast.textContent = mensagem;
    document.body.appendChild(toast);
    setTimeout(()=> toast.remove(), 2600);
}

function atualizarAvisoBackup(){
    const aviso = document.getElementById("avisoBackup");
    if(!aviso) return;

    if(avisoBackupDispensado){
        aviso.hidden = true;
        return;
    }

    const ultimo = localStorage.getItem(CHAVE_ULTIMO_BACKUP);
    const precisaAvisar = !ultimo || diasDesde(ultimo) >= DIAS_PARA_LEMBRAR_BACKUP;
    aviso.hidden = !precisaAvisar;
}

let avisoBackupDispensado = false;
let eventoInstalacao = null;

document.getElementById("btnExportar").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(estado, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plano-treino.json";
    a.click();
    URL.revokeObjectURL(url);

    localStorage.setItem(CHAVE_ULTIMO_BACKUP, hojeISO());
    avisoBackupDispensado = false;
    atualizarAvisoBackup();
});

document.getElementById("btnImportar").addEventListener("click", () => {
    document.getElementById("inputImportar").click();
});

document.getElementById("inputImportar").addEventListener("change", (e) => {
    const arquivo = e.target.files[0];
    if(!arquivo) return;

    if(arquivo.size > TAMANHO_MAX_IMPORT){
        mostrarToast("Arquivo muito grande (máximo de 2MB).", "erro");
        e.target.value = "";
        return;
    }

    const leitor = new FileReader();
    leitor.onload = () => {
        try{
            const novo = JSON.parse(leitor.result);
            if(!novo.dias || !Array.isArray(novo.dias)) throw new Error("Formato inválido");
            estado = normalizarDados(novo);
            diaExpandido = null;
            itemEditando = null;
            salvarEstado();
            renderizar();
            mostrarToast("Plano importado com sucesso!");
        }catch(err){
            mostrarToast("Arquivo JSON inválido: " + err.message, "erro");
        }
    };
    leitor.readAsText(arquivo);
    e.target.value = "";
});

document.getElementById("btnImprimir").addEventListener("click", () => window.print());

document.getElementById("btnFecharAviso")?.addEventListener("click", () => {
    avisoBackupDispensado = true;
    atualizarAvisoBackup();
});

document.getElementById("btnExportarAviso")?.addEventListener("click", () => {
    document.getElementById("btnExportar").click();
});

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    eventoInstalacao = e;
    const btn = document.getElementById("btnInstalar");
    if(btn) btn.hidden = false;
});

document.getElementById("btnInstalar")?.addEventListener("click", async () => {
    if(!eventoInstalacao) return;
    eventoInstalacao.prompt();
    await eventoInstalacao.userChoice;
    eventoInstalacao = null;
    document.getElementById("btnInstalar").hidden = true;
});

window.addEventListener("appinstalled", () => {
    const btn = document.getElementById("btnInstalar");
    if(btn) btn.hidden = true;
    eventoInstalacao = null;
});

const elVersao = document.getElementById("appVersao");
if(elVersao) elVersao.textContent = `v${VERSAO_APP}`;

renderizar();

if("serviceWorker" in navigator){
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("sw.js").catch(err => console.warn("Falha ao registrar service worker:", err));
    });
}

import {
    normalizarDados,
    gerarIdUnico,
    hojeISO,
    diasDesde,
    registrosDoExercicio,
    upsertCarga
} from "./logica.js";

const VERSAO_APP = "0.1.0-beta";
const CHAVE_STORAGE = "treinoAppState";
const CHAVE_ULTIMO_BACKUP = "treinoAppUltimoBackup";
const DIAS_PARA_LEMBRAR_BACKUP = 14;
const TAMANHO_MAX_IMPORT = 2 * 1024 * 1024; // 2MB

const SECAO_COM_CARGA = "Exercícios";

const DADOS_PADRAO = {
    titulo: "Plano de Treino",
    objetivo: "",
    dias: [
        {
            dia: "Segunda-feira",
            classe: "seg",
            secoes: [
                { titulo:"Atividades", itens:[
                    { nome:"Yoga", reps:"1 hora" },
                    { nome:"Caminhada", reps:"3 a 4 km" }
                ]}
            ]
        },
        {
            dia: "Terça-feira — Treino A (Peito + Tríceps + Estabilidade)",
            classe: "ter",
            secoes: [
                { titulo:"Aquecimento", itens:[ { nome:"Caminhada leve", reps:"5 min" } ] },
                { titulo:"Exercícios", itens:[
                    { nome:"Supino Máquina", reps:"3x12" },
                    { nome:"Peck Deck", reps:"3x12" },
                    { nome:"Supino Inclinado Máquina", reps:"2x12" },
                    { nome:"Tríceps Corda", reps:"3x12" },
                    { nome:"Tríceps Barra na Polia", reps:"2x12" },
                    { nome:"Face Pull", reps:"3x15" },
                    { nome:"Prancha", reps:"3x20s" }
                ]},
                { titulo:"Cardio", itens:[ { nome:"Caminhada", reps:"15 min" } ] }
            ]
        },
        {
            dia: "Quarta-feira — Treino B (Costas + Bíceps + Estabilidade)",
            classe: "qua",
            secoes: [
                { titulo:"Aquecimento", itens:[ { nome:"Caminhada leve", reps:"5 min" } ] },
                { titulo:"Exercícios", itens:[
                    { nome:"Puxada Frontal na Polia", reps:"3x12" },
                    { nome:"Remada Baixa Sentada", reps:"3x12" },
                    { nome:"Remada Máquina", reps:"2x12" },
                    { nome:"Rosca Alternada Sentado", reps:"3x12" },
                    { nome:"Rosca Martelo", reps:"2x12" },
                    { nome:"Crucifixo Inverso Máquina", reps:"3x15" },
                    { nome:"Bird Dog", reps:"3x10" }
                ]},
                { titulo:"Cardio", itens:[ { nome:"Caminhada", reps:"15 min" } ] }
            ]
        },
        {
            dia: "Quinta-feira — Treino C (Pernas)",
            classe: "qui",
            secoes: [
                { titulo:"Aquecimento", itens:[ { nome:"Caminhada leve", reps:"5 min" } ] },
                { titulo:"Exercícios", itens:[
                    { nome:"Leg Press 45°", reps:"3x15" },
                    { nome:"Cadeira Extensora", reps:"3x15" },
                    { nome:"Mesa Flexora", reps:"3x15" },
                    { nome:"Cadeira Flexora", reps:"3x15" },
                    { nome:"Glúteo Máquina", reps:"3x15" },
                    { nome:"Panturrilha Sentada", reps:"4x15" },
                    { nome:"Dead Bug", reps:"3x10" }
                ]},
                { titulo:"Cardio", itens:[ { nome:"Caminhada", reps:"15 min" } ] }
            ]
        },
        {
            dia: "Sexta-feira",
            classe: "sex",
            secoes: [
                { titulo:"Atividades", itens:[
                    { nome:"Yoga", reps:"1 hora" },
                    { nome:"Caminhada", reps:"3 a 4 km" }
                ]}
            ]
        },
        {
            dia: "Sábado — Treino D (Ombros + Core + Estabilidade)",
            classe: "sab",
            secoes: [
                { titulo:"Aquecimento", itens:[ { nome:"Caminhada leve", reps:"5 min" } ] },
                { titulo:"Exercícios", itens:[
                    { nome:"Elevação Lateral", reps:"3x15" },
                    { nome:"Crucifixo Inverso", reps:"3x15" },
                    { nome:"Face Pull", reps:"3x15" },
                    { nome:"Rotação Externa com Elástico", reps:"3x15" },
                    { nome:"Rotação Externa na Polia", reps:"3x15" },
                    { nome:"Prancha", reps:"3x30s" },
                    { nome:"Bird Dog", reps:"3x10" }
                ]},
                { titulo:"Cardio", itens:[ { nome:"Caminhada", reps:"15 min" } ] }
            ]
        }
    ],
    cargas: []
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
let rascunho = null;
let modoEdicao = false;
let eventoInstalacao = null;
let avisoBackupDispensado = false;
const historicoAberto = new Set();

function dadosAtuais(){
    return modoEdicao ? rascunho : estado;
}

function renderizar(){
    const dados = dadosAtuais();

    document.title = (dados.titulo || "Plano de Treino").replace(/[^\w\sÀ-ÿ()\-–—.,'"!?:/+]/g,"").trim() || "Plano de Treino";

    const headerTitulo = document.getElementById("headerTitulo");
    const headerObjetivo = document.getElementById("headerObjetivo");

    if(modoEdicao){
        headerTitulo.innerHTML = `<input type="text" id="campoTituloHeader" value="${escapeAttr(dados.titulo)}">`;
        headerObjetivo.innerHTML = `
            <strong>Objetivo:</strong>
            <textarea id="campoObjetivo" rows="3" placeholder="Ex: ganhar força, emagrecer, manter a constância...">${escapeHtml(dados.objetivo)}</textarea>
        `;
        document.getElementById("campoTituloHeader").addEventListener("input", e=>{ rascunho.titulo = e.target.value; });
        document.getElementById("campoObjetivo").addEventListener("input", e=>{ rascunho.objetivo = e.target.value; });
    } else {
        headerTitulo.innerHTML = `<h1>${escapeHtml(dados.titulo)}</h1>`;
        headerObjetivo.innerHTML = dados.objetivo
            ? `<strong>Objetivo:</strong> ${escapeHtml(dados.objetivo)}`
            : "";
    }

    document.getElementById("btnEditar").hidden = modoEdicao;
    document.getElementById("btnSalvar").hidden = !modoEdicao;
    document.getElementById("btnCancelar").hidden = !modoEdicao;

    const container = document.getElementById("dias");
    container.innerHTML = "";

    dados.dias.forEach((treino, di) => {
        const card = document.createElement("div");
        card.className = `card ${treino.classe || ""}`;

        let html = `<div class="titulo">`;
        html += modoEdicao
            ? `<input type="text" data-dia="${di}" class="campo-dia" value="${escapeAttr(treino.dia)}">`
            : escapeHtml(treino.dia);
        html += `</div><div class="conteudo">`;

        treino.secoes.forEach((secao, si) => {
            const comCarga = !modoEdicao && secao.titulo === SECAO_COM_CARGA;
            html += `<div class="secao"><h3>${escapeHtml(secao.titulo)}</h3><ul>`;

            secao.itens.forEach((item, ii) => {
                if(modoEdicao){
                    html += `
                        <li>
                            <input type="text" class="nome campo-item" data-dia="${di}" data-secao="${si}" data-item="${ii}" data-campo="nome" value="${escapeAttr(item.nome)}">
                            <input type="text" class="reps campo-item" data-dia="${di}" data-secao="${si}" data-item="${ii}" data-campo="reps" value="${escapeAttr(item.reps)}">
                            <button class="remover" data-dia="${di}" data-secao="${si}" data-item="${ii}" title="Remover">✕</button>
                        </li>
                    `;
                } else if(comCarga){
                    const registros = registrosDoExercicio(estado.cargas, item.id);
                    const registroHoje = registros.find(r=>r.data === hojeISO());
                    const ultimo = registros[0];
                    const aberto = historicoAberto.has(item.id);

                    html += `
                        <li>
                            <div class="item-principal">
                                <span class="item-nome">${escapeHtml(item.nome)}</span>
                                <span class="badge">${escapeHtml(item.reps)}</span>
                            </div>
                            <div class="carga">
                                <input type="number" inputmode="decimal" step="0.5" min="0" placeholder="kg"
                                    class="campo-kg" data-ex="${item.id}"
                                    value="${registroHoje ? registroHoje.peso : ""}">
                                ${ultimo ? `<button type="button" class="carga-ultimo" data-toggle="${item.id}">último: ${ultimo.peso}kg</button>` : ""}
                            </div>
                            ${aberto ? `<div class="carga-historico">${
                                registros.slice(0,5).map(r=>`<span>${r.data}: ${r.peso}kg</span>`).join("") || "Sem registros"
                            }</div>` : ""}
                        </li>
                    `;
                } else {
                    html += `
                        <li>
                            <span class="item-nome">${escapeHtml(item.nome)}</span>
                            <span class="badge">${escapeHtml(item.reps)}</span>
                        </li>
                    `;
                }
            });

            html += `</ul>`;
            if(modoEdicao){
                html += `<button class="add-exercicio" data-dia="${di}" data-secao="${si}">+ Adicionar exercício</button>`;
            }
            html += `</div>`;
        });

        html += `</div>`;
        card.innerHTML = html;
        container.appendChild(card);
    });

    if(modoEdicao){
        container.querySelectorAll(".campo-dia").forEach(el=>{
            el.addEventListener("input", e=>{
                rascunho.dias[e.target.dataset.dia].dia = e.target.value;
            });
        });
        container.querySelectorAll(".campo-item").forEach(el=>{
            el.addEventListener("input", e=>{
                const {dia, secao, item, campo} = e.target.dataset;
                rascunho.dias[dia].secoes[secao].itens[item][campo] = e.target.value;
            });
        });
        container.querySelectorAll(".remover").forEach(el=>{
            el.addEventListener("click", e=>{
                const {dia, secao, item} = e.target.dataset;
                rascunho.dias[dia].secoes[secao].itens.splice(item,1);
                renderizar();
            });
        });
        container.querySelectorAll(".add-exercicio").forEach(el=>{
            el.addEventListener("click", e=>{
                const {dia, secao} = e.target.dataset;
                const idsExistentes = new Set();
                rascunho.dias.forEach(d=>d.secoes.forEach(s=>s.itens.forEach(it=>idsExistentes.add(it.id))));
                const novoId = gerarIdUnico("Novo exercício", idsExistentes);
                rascunho.dias[dia].secoes[secao].itens.push({ id: novoId, nome:"Novo exercício", reps:"3x10" });
                renderizar();
            });
        });
    } else {
        container.querySelectorAll(".campo-kg").forEach(el=>{
            el.addEventListener("change", e=>{
                upsertCarga(estado.cargas, e.target.dataset.ex, e.target.value);
                salvarEstado();
                renderizar();
            });
        });
        container.querySelectorAll(".carga-ultimo").forEach(el=>{
            el.addEventListener("click", e=>{
                const id = e.target.dataset.toggle;
                if(historicoAberto.has(id)) historicoAberto.delete(id);
                else historicoAberto.add(id);
                renderizar();
            });
        });
    }

    atualizarAvisoBackup();
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

    if(avisoBackupDispensado || modoEdicao || estado.cargas.length === 0){
        aviso.hidden = true;
        return;
    }

    const ultimo = localStorage.getItem(CHAVE_ULTIMO_BACKUP);
    const precisaAvisar = !ultimo || diasDesde(ultimo) >= DIAS_PARA_LEMBRAR_BACKUP;
    aviso.hidden = !precisaAvisar;
}

document.getElementById("btnEditar").addEventListener("click", () => {
    rascunho = JSON.parse(JSON.stringify(estado));
    modoEdicao = true;
    renderizar();
});

document.getElementById("btnCancelar").addEventListener("click", () => {
    rascunho = null;
    modoEdicao = false;
    renderizar();
});

document.getElementById("btnSalvar").addEventListener("click", () => {
    estado = normalizarDados(rascunho);
    rascunho = null;
    modoEdicao = false;
    salvarEstado();
    renderizar();
});

document.getElementById("btnExportar").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(dadosAtuais(), null, 2)], {type:"application/json"});
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
            rascunho = null;
            modoEdicao = false;
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

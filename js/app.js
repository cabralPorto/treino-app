const CHAVE_STORAGE = "treinoAppState";
const VERSAO_ATUAL = 2;

const DADOS_PADRAO = {
    titulo: "Plano de Treino — Primeiros 30 Dias",
    objetivo: "Retornar à musculação minimizando o risco de reacender o processo inflamatório cervical.",
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

const SECAO_COM_CARGA = "Exercícios";

function slugify(texto){
    return (texto || "")
        .toString()
        .normalize("NFD").replace(/[̀-ͯ]/g,"")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g,"-")
        .replace(/^-+|-+$/g,"");
}

function gerarIdUnico(nomeBase, idsExistentes){
    const base = slugify(nomeBase) || "exercicio";
    let id = base, n = 2;
    while(idsExistentes.has(id)){ id = `${base}-${n}`; n++; }
    idsExistentes.add(id);
    return id;
}

function normalizarDados(bruto){
    const dados = JSON.parse(JSON.stringify(bruto || {}));
    dados.titulo = dados.titulo ?? "";
    dados.objetivo = dados.objetivo ?? "";
    dados.dias = Array.isArray(dados.dias) ? dados.dias : [];

    const idsExistentes = new Set();

    dados.dias.forEach(dia=>{
        dia.secoes = Array.isArray(dia.secoes) ? dia.secoes : [];
        dia.secoes.forEach(secao=>{
            const itensBrutos = Array.isArray(secao.itens) ? secao.itens : [];
            secao.itens = itensBrutos.map(item=>{
                if(Array.isArray(item)){
                    const nome = item[0] ?? "";
                    const reps = item[1] ?? "";
                    return { id: gerarIdUnico(nome, idsExistentes), nome, reps };
                }
                if(item && typeof item === "object"){
                    let id = item.id;
                    if(!id || idsExistentes.has(id)){
                        id = gerarIdUnico(item.nome, idsExistentes);
                    } else {
                        idsExistentes.add(id);
                    }
                    return { id, nome: item.nome ?? "", reps: item.reps ?? "" };
                }
                return { id: gerarIdUnico("exercicio", idsExistentes), nome:"", reps:"" };
            });
        });
    });

    dados.cargas = Array.isArray(dados.cargas)
        ? dados.cargas.filter(c => c && c.exercicioId && c.data).map(c=>({
            exercicioId: c.exercicioId,
            data: c.data,
            peso: Number(c.peso)
        }))
        : [];

    dados.versao = VERSAO_ATUAL;
    return dados;
}

function carregarEstado(){
    const salvo = localStorage.getItem(CHAVE_STORAGE);
    if(salvo){
        try{ return normalizarDados(JSON.parse(salvo)); }
        catch(e){ console.warn("Estado salvo inválido, usando padrão.", e); }
    }
    return normalizarDados(DADOS_PADRAO);
}

function salvarEstado(){
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(estado));
}

let estado = carregarEstado();
let rascunho = null;
let modoEdicao = false;
const historicoAberto = new Set();

function dadosAtuais(){
    return modoEdicao ? rascunho : estado;
}

function hojeISO(){
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function registrosDoExercicio(exercicioId){
    return estado.cargas
        .filter(c=>c.exercicioId === exercicioId)
        .sort((a,b)=> a.data < b.data ? 1 : (a.data > b.data ? -1 : 0));
}

function upsertCarga(exercicioId, pesoTexto){
    const data = hojeISO();
    const idx = estado.cargas.findIndex(c=>c.exercicioId === exercicioId && c.data === data);
    const pesoTrim = (pesoTexto ?? "").toString().trim();

    if(pesoTrim === ""){
        if(idx >= 0) estado.cargas.splice(idx,1);
    } else {
        const peso = Number(pesoTrim.replace(",", "."));
        if(Number.isNaN(peso)) return;
        if(idx >= 0) estado.cargas[idx].peso = peso;
        else estado.cargas.push({ exercicioId, data, peso });
    }
    salvarEstado();
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
            <textarea id="campoObjetivo" rows="3">${escapeHtml(dados.objetivo)}</textarea>
        `;
        document.getElementById("campoTituloHeader").addEventListener("input", e=>{ rascunho.titulo = e.target.value; });
        document.getElementById("campoObjetivo").addEventListener("input", e=>{ rascunho.objetivo = e.target.value; });
    } else {
        headerTitulo.innerHTML = `<h1>${escapeHtml(dados.titulo)}</h1>`;
        headerObjetivo.innerHTML = `<strong>Objetivo:</strong> ${escapeHtml(dados.objetivo)}`;
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
                    const registros = registrosDoExercicio(item.id);
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
                upsertCarga(e.target.dataset.ex, e.target.value);
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
});

document.getElementById("btnImportar").addEventListener("click", () => {
    document.getElementById("inputImportar").click();
});

document.getElementById("inputImportar").addEventListener("change", (e) => {
    const arquivo = e.target.files[0];
    if(!arquivo) return;
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

renderizar();

if("serviceWorker" in navigator){
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("sw.js").catch(err => console.warn("Falha ao registrar service worker:", err));
    });
}

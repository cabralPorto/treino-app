export const VERSAO_ATUAL = 2;
export const MAX_DIAS = 30;
export const MAX_ITENS_POR_SECAO = 50;

export function slugify(texto){
    return (texto || "")
        .toString()
        .normalize("NFD").replace(/[̀-ͯ]/g,"")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g,"-")
        .replace(/^-+|-+$/g,"");
}

export function gerarIdUnico(nomeBase, idsExistentes){
    const base = slugify(nomeBase) || "exercicio";
    let id = base, n = 2;
    while(idsExistentes.has(id)){ id = `${base}-${n}`; n++; }
    idsExistentes.add(id);
    return id;
}

export function normalizarDados(bruto){
    const dados = JSON.parse(JSON.stringify(bruto || {}));
    dados.titulo = typeof dados.titulo === "string" ? dados.titulo : "";
    dados.objetivo = typeof dados.objetivo === "string" ? dados.objetivo : "";
    dados.dias = (Array.isArray(dados.dias) ? dados.dias : []).slice(0, MAX_DIAS);

    const idsExistentes = new Set();

    dados.dias.forEach(dia=>{
        dia.dia = typeof dia.dia === "string" ? dia.dia : "";
        const secoesBrutas = Array.isArray(dia.secoes) ? dia.secoes : [];
        dia.secoes = secoesBrutas.map(secao=>{
            const itensBrutos = (Array.isArray(secao.itens) ? secao.itens : []).slice(0, MAX_ITENS_POR_SECAO);
            const itens = itensBrutos.map(item=>{
                if(Array.isArray(item)){
                    const nome = item[0] ?? "";
                    const reps = item[1] ?? "";
                    return { id: gerarIdUnico(nome, idsExistentes), nome, reps };
                }
                if(item && typeof item === "object"){
                    let id = item.id;
                    if(typeof id !== "string" || !id || idsExistentes.has(id)){
                        id = gerarIdUnico(item.nome, idsExistentes);
                    } else {
                        idsExistentes.add(id);
                    }
                    return { id, nome: item.nome ?? "", reps: item.reps ?? "" };
                }
                return { id: gerarIdUnico("exercicio", idsExistentes), nome:"", reps:"" };
            });
            return { titulo: typeof secao.titulo === "string" ? secao.titulo : "", itens };
        });
    });

    dados.versao = VERSAO_ATUAL;
    return dados;
}

export function hojeISO(){
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

export function diasDesde(dataISO){
    const [y, m, d] = dataISO.split("-").map(Number);
    const entao = new Date(y, m - 1, d);
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    entao.setHours(0,0,0,0);
    return Math.round((hoje - entao) / 86400000);
}


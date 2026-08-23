import { test } from "node:test";
import assert from "node:assert/strict";

import {
    slugify,
    gerarIdUnico,
    normalizarDados,
    hojeISO,
    diasDesde,
    MAX_DIAS,
    MAX_ITENS_POR_SECAO
} from "../js/logica.js";

test("slugify remove acentos, pontuação e normaliza espaços", () => {
    assert.equal(slugify("Supino Máquina!"), "supino-maquina");
    assert.equal(slugify("  Tríceps Corda  "), "triceps-corda");
    assert.equal(slugify(""), "");
});

test("gerarIdUnico evita colisão adicionando sufixo numérico", () => {
    const ids = new Set();
    const id1 = gerarIdUnico("Supino", ids);
    const id2 = gerarIdUnico("Supino", ids);
    const id3 = gerarIdUnico("Supino", ids);
    assert.equal(id1, "supino");
    assert.equal(id2, "supino-2");
    assert.equal(id3, "supino-3");
});

test("normalizarDados converte itens no formato antigo [nome, reps] para objetos com id", () => {
    const antigo = {
        titulo: "Plano antigo",
        objetivo: "",
        dias: [
            { dia: "Segunda", classe: "seg", secoes: [
                { titulo: "Exercícios", itens: [["Supino Máquina", "3x12"]] }
            ]}
        ]
    };
    const novo = normalizarDados(antigo);
    const item = novo.dias[0].secoes[0].itens[0];
    assert.equal(item.nome, "Supino Máquina");
    assert.equal(item.reps, "3x12");
    assert.equal(typeof item.id, "string");
    assert.ok(item.id.length > 0);
});

test("normalizarDados preserva ids já existentes e gera novos só quando faltam ou colidem", () => {
    const bruto = {
        dias: [
            { dia: "A", secoes: [ { titulo: "Exercícios", itens: [
                { id: "meu-id", nome: "X", reps: "3x10" },
                { nome: "Y", reps: "3x10" }
            ]}]}
        ]
    };
    const novo = normalizarDados(bruto);
    assert.equal(novo.dias[0].secoes[0].itens[0].id, "meu-id");
    assert.notEqual(novo.dias[0].secoes[0].itens[1].id, "");
});

test("normalizarDados limita quantidade de dias e itens por seção", () => {
    const muitosDias = Array.from({ length: MAX_DIAS + 10 }, (_, i) => ({
        dia: `Dia ${i}`, secoes: []
    }));
    const bruto = { dias: muitosDias };
    const novo = normalizarDados(bruto);
    assert.equal(novo.dias.length, MAX_DIAS);

    const muitosItens = Array.from({ length: MAX_ITENS_POR_SECAO + 10 }, (_, i) => ({
        nome: `Item ${i}`, reps: "3x10"
    }));
    const brutoItens = { dias: [{ dia: "A", secoes: [{ titulo: "Exercícios", itens: muitosItens }] }] };
    const novoItens = normalizarDados(brutoItens);
    assert.equal(novoItens.dias[0].secoes[0].itens.length, MAX_ITENS_POR_SECAO);
});

test("hojeISO retorna data no formato AAAA-MM-DD", () => {
    assert.match(hojeISO(), /^\d{4}-\d{2}-\d{2}$/);
});

test("diasDesde calcula a diferença correta em dias", () => {
    const hoje = new Date();
    const dez = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 10);
    const iso = `${dez.getFullYear()}-${String(dez.getMonth()+1).padStart(2,"0")}-${String(dez.getDate()).padStart(2,"0")}`;
    assert.equal(diasDesde(iso), 10);
});

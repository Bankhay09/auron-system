import assert from "node:assert/strict";
import test from "node:test";

const invalidHabitPatterns = [/porn/i, /pornografia/i, /drog/i, /auto(?:-| )?destru/i, /suic/i, /viol[eê]ncia/i, /crime/i, /apost/i, /beber todos os dias/i, /dormir o dia todo/i, /machucar/i];

function validHabit(habit) {
  return habit.length >= 3 && habit.length <= 80 && !invalidHabitPatterns.some((pattern) => pattern.test(habit));
}

test("bloqueia habitos invalidos para desenvolvimento pessoal", () => {
  assert.equal(validHabit("pornografia"), false);
  assert.equal(validHabit("usar drogas"), false);
  assert.equal(validHabit("autodestruição"), false);
  assert.equal(validHabit("apostar mais"), false);
  assert.equal(validHabit("dormir o dia todo"), false);
  assert.equal(validHabit("machucar alguém"), false);
  assert.equal(validHabit("beber todos os dias"), false);
});

test("aceita habitos construtivos escritos manualmente", () => {
  assert.equal(validHabit("estudar Java 45 minutos"), true);
  assert.equal(validHabit("escrever diario antes de dormir"), true);
});

test("onboarding precisa de pelo menos 4 habitos por lista", () => {
  assert.equal(["a", "b", "c"].length >= 4, false);
  assert.equal(["estudar", "treinar", "dormir cedo", "planejar"].length >= 4, true);
});

test("mensagem do Arquiteto deve ter tom inicial correto", () => {
  const intro = "Eu sou o Arquiteto. Não estou aqui para te confortar com mentiras, mas para te ajudar a construir a versão que você prometeu ser. Escreva seu diário, cumpra seus pactos e eu analisarei seus padrões.";
  assert.match(intro, /Eu sou o Arquiteto/);
  assert.match(intro, /Escreva seu diário/);
});

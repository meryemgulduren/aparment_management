import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ValidationError } from "./errors.js";
import { amountKurusSchema, optionalText, parseInput } from "./validation.js";

describe("optionalText", () => {
  const schema = z.object({ note: optionalText(5) });

  it("gönderilmeyen alan undefined kalır (güncellemede dokunulmaz)", () => {
    expect(parseInput(schema, {})).toEqual({ note: undefined });
  });

  it("boş veya yalnızca boşluk null olur", () => {
    expect(parseInput(schema, { note: "   " })).toEqual({ note: null });
    expect(parseInput(schema, { note: null })).toEqual({ note: null });
  });

  it("baştaki/sondaki boşluğu siler", () => {
    expect(parseInput(schema, { note: " abc " })).toEqual({ note: "abc" });
  });
});

describe("parseInput", () => {
  it("hatalı alanları alan adıyla bildirir", () => {
    const schema = z.object({ amountKurus: amountKurusSchema });
    try {
      parseInput(schema, { amountKurus: -5 });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).fields).toEqual({
        amountKurus: "Tutar sıfırdan büyük olmalı.",
      });
    }
  });

  it("şemada olmayan alanları atar", () => {
    const schema = z.object({ name: z.string() });
    expect(parseInput(schema, { name: "a", id: 99 })).toEqual({ name: "a" });
  });

  it("kuruşta küsurat kabul etmez ve bunu açıkça söyler", () => {
    expect(() => parseInput(z.object({ a: amountKurusSchema }), { a: 10.5 })).toThrow(
      ValidationError,
    );
    try {
      parseInput(z.object({ a: amountKurusSchema }), { a: 10.5 });
    } catch (error) {
      expect((error as ValidationError).fields?.a).toContain("ondalık");
    }
  });

  it("eksik alan için sade mesaj verir", () => {
    try {
      parseInput(z.object({ name: z.string() }), {});
      expect.unreachable();
    } catch (error) {
      expect((error as ValidationError).fields).toEqual({ name: "Bu alan zorunlu." });
    }
  });
});

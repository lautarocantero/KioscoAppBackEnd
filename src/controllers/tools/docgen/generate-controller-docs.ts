/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎭 Generador de documentación de controladores (TypeScript + ts-morph) 🎭                                                 ║
║                                                                                                                           ║
║ 📥 Entrada:                                                                                                               ║
║   - Directorio de controladores y patrón de archivos .ts                                                                  ║
║                                                                                                                           ║
║ ⚙️ Proceso:                                                                                                               ║
║   - Analiza el AST, detecta funciones exportadas y antepone bloques teatrales                                             ║
║                                                                                                                           ║
║ 📤 Salida:                                                                                                                ║
║   - Copias .doc.ts de cada controlador con documentación incluida                                                         ║
║                                                                                                                           ║
║ 🛠️ Errores:                                                                                                               ║
║   - Falla de lectura/escritura o archivos sin funciones exportadas                                                        ║
║                                                                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

import { Project, SourceFile, FunctionDeclaration, SyntaxKind } from "ts-morph";
import fs from "fs";
import path from "path";

/** Configuración: ajustá rutas según tu repo */
const CONTROLLERS_DIR = path.resolve("controllers");
const OUTPUT_SUFFIX = ".doc.ts";

/** Template del bloque teatral: recibe nombre y metadatos básicos */
function docBlockTemplate(name: string, params: string[], responseType: string): string {
  const paramsLine = params.length ? params.join(", ") : "No recibe parámetros relevantes";
  return `/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 Función ${name} 🎮                                                                                                     ║
║                                                                                                                           ║
║ 📥 Entrada:                                                                                                               ║
║   - Parámetros: ${paramsLine}                                                                                              ║
║                                                                                                                           ║
║ ⚙️ Proceso:                                                                                                               ║
║   - Controlador Express: procesa solicitud y delega al modelo/servicios                                                   ║
║                                                                                                                           ║
║ 📤 Salida:                                                                                                                ║
║   - ${responseType}                                                                                                       ║
║                                                                                                                           ║
║ 🛠️ Errores:                                                                                                               ║
║   - Delegados a handleControllerError para respuestas consistentes y centralizadas                                        ║
║                                                                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/`;
}

/** Deducción simple de salida según contenido del cuerpo */
function inferResponseType(fn: FunctionDeclaration): string {
  const text = fn.getText();
  if (text.includes(".json(")) return "JSON (payload específico según la operación)";
  if (text.includes(".send(")) return "HTML (contenido estático o templado)";
  return "Respuesta HTTP (dependiente de implementación)";
}

/** Obtiene funciones exportadas: declaraciones y export const/asignaciones */
function getExportedFunctions(source: SourceFile): { name: string; declText: string; fnNode: FunctionDeclaration | null; params: string[]; }[] {
  const results: { name: string; declText: string; fnNode: FunctionDeclaration | null; params: string[]; }[] = [];

  // export async function nombre(...) { ... }
  for (const fn of source.getFunctions()) {
    if (fn.isExported()) {
      results.push({
        name: fn.getName() || "función_sin_nombre",
        declText: fn.getText(),
        fnNode: fn,
        params: fn.getParameters().map(p => p.getName())
      });
    }
  }

  // export const nombre = async (...) => { ... }
  const varStatements = source.getVariableStatements().filter(v => v.isExported());
  for (const vs of varStatements) {
    const decs = vs.getDeclarations();
    for (const d of decs) {
      const name = d.getName();
      const initializer = d.getInitializer();
      if (initializer && initializer.getKind() === SyntaxKind.ArrowFunction) {
        const arrow = initializer.asKindOrThrow(SyntaxKind.ArrowFunction);
        results.push({
          name,
          declText: vs.getText(),
          fnNode: null,
          params: arrow.getParameters().map(p => p.getName())
        });
      }
    }
  }

  return results;
}

/** Inserta documentación antes de cada función exportada y guarda archivo .doc.ts */
function processFile(filePath: string): void {
  const project = new Project({ tsConfigFilePath: "tsconfig.json" });
  const source = project.addSourceFileAtPath(filePath);

  const exportedFns = getExportedFunctions(source);
  if (exportedFns.length === 0) {
    console.warn(`Sin funciones exportadas: ${filePath}`);
    return;
  }

  // Generamos una copia del archivo para no tocar el original
  const outputPath = filePath.replace(/\.ts$/, OUTPUT_SUFFIX);

  // Construimos nuevo contenido: recorremos el archivo y pegamos doc + función
  let newContent = source.getText();

  // Estrategia: sustituir cada bloque de función por docBlock + bloque original
  for (const item of exportedFns) {
    const doc = docBlockTemplate(item.name, item.params, item.fnNode ? inferResponseType(item.fnNode) : "Respuesta HTTP (dependiente de implementación)");
    const originalText = item.fnNode ? item.fnNode.getText() : item.declText;

    // Para evitar colisiones, usamos un marcador único por función
    const replaced = newContent.replace(originalText, `${doc}\n${originalText}`);
    newContent = replaced;
  }

  fs.writeFileSync(outputPath, newContent, "utf8");
  console.log(`Documentado: ${outputPath}`);
}

/** Recorre el directorio de controladores y procesa cada .ts */
function run(): void {
  if (!fs.existsSync(CONTROLLERS_DIR)) {
    console.error(`No existe el directorio: ${CONTROLLERS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(CONTROLLERS_DIR)
    .filter(f => f.endsWith(".ts"))
    .map(f => path.join(CONTROLLERS_DIR, f));

  if (files.length === 0) {
    console.warn("No se encontraron archivos .ts en controllers/");
    return;
  }

  files.forEach(processFile);
}

run();

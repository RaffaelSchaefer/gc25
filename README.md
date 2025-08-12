## Langfuse Observability

Dieses Projekt nutzt [Langfuse](https://langfuse.com/) für Observability, Tracing und Debugging von LLM/AI-Features.

**Setup:**

1. Lege folgende Variablen in deiner `.env` an:
   - `LANGFUSE_SECRET_KEY`
   - `LANGFUSE_PUBLIC_KEY`
   - `LANGFUSE_BASEURL` (z.B. `https://cloud.langfuse.com`)
2. Die Instrumentierung ist in `instrumentation.ts` eingerichtet und wird automatisch von Next.js erkannt.
3. Telemetrie ist im AI-Handler (`experimental_telemetry`) aktiviert und überträgt User/Session/Persona/Modell-Kontext.

**Features:**

- Application Traces, Usage, Cost, Replay, Evaluations, Prompt-Linking, Custom Metadata
- Gruppierung mehrerer AI-Calls in einem Trace möglich (siehe Langfuse-Doku)

Weitere Infos: [Langfuse Docs](https://langfuse.com/docs)

# GC25

## TODO

- Add PWA icon images (192x192, 512x512, and apple-touch-icon) under `public/` with the correct specifications.

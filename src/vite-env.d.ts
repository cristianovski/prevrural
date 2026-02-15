/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Corrige o erro vermelho do html-docx
declare module 'html-docx-js-typescript' {
    export function asBlob(html: string): Promise<Blob>;
}

// Corrige o erro vermelho do file-saver
declare module 'file-saver' {
    export function saveAs(data: Blob | string, filename?: string, options?: any): void;
}
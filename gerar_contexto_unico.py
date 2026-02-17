import os

def gerar_arquivao():
    output_filename = "PROJETO_COMPLETO_PREVRURAL.txt"
    
    # Extensões que queremos ler
    ALLOWED_EXTENSIONS = {'.ts', '.tsx', '.css', '.json', '.html', '.env'}
    
    # Pastas para IGNORAR (Segurança máxima)
    IGNORE_DIRS = {'node_modules', 'dist', 'build', '.git', '.vscode', 'coverage', '__pycache__'}
    
    # Arquivos específicos da raiz
    ROOT_FILES = ['package.json', 'tsconfig.json', 'vite.config.ts', 'index.html', '.env', 'tailwind.config.js', 'postcss.config.js']

    print(f"📄 Criando arquivo único: {output_filename}...")
    
    with open(output_filename, 'w', encoding='utf-8') as outfile:
        outfile.write(f"--- CONTEXTO DO PROJETO PREVRURAL ---\n")
        outfile.write(f"--- ESTE ARQUIVO CONTÉM TODO O CÓDIGO FONTE CONCATENADO ---\n\n")

        # 1. Arquivos da Raiz
        for filename in ROOT_FILES:
            if os.path.exists(filename):
                outfile.write(f"\n{'='*50}\n")
                outfile.write(f"FILE: {filename}\n")
                outfile.write(f"{'='*50}\n")
                try:
                    with open(filename, 'r', encoding='utf-8') as infile:
                        outfile.write(infile.read())
                except Exception as e:
                    outfile.write(f"[Erro ao ler arquivo: {e}]")
                outfile.write("\n")

        # 2. Varre a pasta SRC
        for root, dirs, files in os.walk('src'):
            # Remove pastas ignoradas
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in ALLOWED_EXTENSIONS:
                    file_path = os.path.join(root, file)
                    
                    # Escreve o cabeçalho do arquivo
                    outfile.write(f"\n{'='*50}\n")
                    outfile.write(f"FILE: {file_path}\n")
                    outfile.write(f"{'='*50}\n")
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8') as infile:
                            outfile.write(infile.read())
                    except Exception as e:
                        outfile.write(f"[Erro ao ler arquivo: {e}]")
                    outfile.write("\n")

    print(f"✅ Sucesso! O arquivo '{output_filename}' foi criado.")
    print("👉 Anexe ESTE arquivo único no novo chat. Ele não dará erro.")

if __name__ == "__main__":
    gerar_arquivao()
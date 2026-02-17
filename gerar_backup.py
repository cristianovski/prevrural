import tarfile
import os
import datetime

# Nome do arquivo de saída com data e hora
timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
output_filename = f"backup_prevrural_{timestamp}.tar"

# Pastas e arquivos para IGNORAR (não incluir no backup)
IGNORE_LIST = {
    'node_modules', 
    '.git', 
    'dist', 
    '.vscode',
    '__pycache__',
    output_filename, # Não incluir o próprio arquivo que está sendo gerado
    'gerar_backup.py',
    'resgate_total.py',
    'gerar_tar.py'
}

def is_ignored(path):
    parts = path.split(os.sep)
    # Se qualquer parte do caminho estiver na lista de ignorados
    for part in parts:
        if part in IGNORE_LIST:
            return True
    return False

print(f"📦 Iniciando backup em: {output_filename}...")

with tarfile.open(output_filename, "w") as tar:
    # Percorre todos os arquivos da pasta atual
    for root, dirs, files in os.walk("."):
        # Remove diretórios ignorados da busca para não entrar neles
        dirs[:] = [d for d in dirs if d not in IGNORE_LIST]
        
        for file in files:
            # Caminho completo do arquivo
            file_path = os.path.join(root, file)
            
            # Remove o "./" do início para ficar bonito no tar
            arcname = os.path.normpath(file_path)
            
            if not is_ignored(arcname):
                print(f"  Adicionando: {arcname}")
                tar.add(file_path, arcname=arcname)

print(f"\n✅ Sucesso! Backup criado: {output_filename}")
print("Pode baixar este arquivo para o seu computador.")
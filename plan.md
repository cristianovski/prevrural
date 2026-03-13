1. Import `useToast` from `../../hooks/use-toast` and `useConfirm` from `../../hooks/use-confirm` in `src/pages/admin/LibraryPage.tsx`.
2. Retrieve `toast` from `useToast()` and `confirm`, `ConfirmDialog` from `useConfirm()` inside `LibraryPage`.
3. Replace `alert("Preencha título e conteúdo.")` with `toast({ title: "Erro", description: "Preencha título e conteúdo.", variant: "destructive" })`.
4. Replace `alert("Tem certeza que deseja excluir esta tese?")` with `const ok = await confirm("Tem certeza que deseja excluir esta tese?"); if (!ok) return;`
5. Replace `alert("Sucesso! X teses importadas.")` with `toast({ title: "Sucesso", description: \`\${count} teses importadas.\`, variant: "success" })`.
6. Replace `alert("Erro ao ler o JSON: " + msg)` with `toast({ title: "Erro", description: \`Erro ao ler o JSON: \${msg}\`, variant: "destructive" })`.
7. Add `<ConfirmDialog />` to the end of the returned JSX in `LibraryPage.tsx`.

export function useConfirm() {
  const confirm = async (message: string): Promise<boolean> => {
    return window.confirm(message);
  };

  return { confirm };
}

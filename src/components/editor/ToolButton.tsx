import React from 'react';

interface ToolButtonProps {
  cmd: string;
  icon: React.ElementType;
  title?: string;
  onClick?: () => void;
}

export function ToolButton({ cmd, icon: Icon, title, onClick }: ToolButtonProps) {
  const handleClick = () => {
    if (onClick) onClick();
    else document.execCommand(cmd, false, undefined);
  };

  return (
    <button
      onClick={handleClick}
      className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
      title={title}
      type="button"
    >
      <Icon size={16} />
    </button>
  );
}
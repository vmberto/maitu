type NewListButtonProps = {
  onClick: () => void;
};

export const NewListButton = ({ onClick }: NewListButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-10 mt-8 w-full cursor-pointer rounded-md border-2
        border-dotted border-slate-400 p-4 text-center align-middle text-slate-400
         opacity-100 transition-all betterhover:hover:border-primary betterhover:hover:bg-white
         betterhover:hover:text-primary"
    >
      Add New List
    </button>
  );
};

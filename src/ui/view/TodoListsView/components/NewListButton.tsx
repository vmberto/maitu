interface NewListButtonProps {
  onClick: () => void;
}

export const NewListButton = ({ onClick }: NewListButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="mb-10 mt-8 flex w-full cursor-pointer items-center rounded-md
        border-2 border-dotted border-slate-400
          p-4 align-middle text-slate-400
         opacity-100 transition-all betterhover:hover:border-primary betterhover:hover:bg-white betterhover:hover:text-primary"
    >
      <h1 className="w-full text-center">Add New List</h1>
    </button>
  );
};

interface NewListButtonProps {
    onClick: () => void;
}

export const NewListButton = ({onClick}: NewListButtonProps) => {

    return (
        <button
            onClick={onClick}
            className="mt-8 mb-10 opacity-100 w-full border-dotted border-2 border-slate-400
        transition-all cursor-pointer text-slate-400
          p-4 rounded-md items-center
         flex align-middle betterhover:hover:bg-white betterhover:hover:border-primary betterhover:hover:text-primary">
            <h1 className="w-full text-center">Add New List</h1>
        </button>
    );
};


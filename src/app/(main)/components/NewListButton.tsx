type NewListButtonProps = {
  onClick: () => void;
};

export const NewListButton = ({ onClick }: NewListButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rubber-button mb-10 mt-8 w-full px-4 py-3 text-center text-sm font-medium text-gray-700 hover:text-primary"
    >
      New List
    </button>
  );
};

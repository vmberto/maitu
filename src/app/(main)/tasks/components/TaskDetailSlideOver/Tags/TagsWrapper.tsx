import { XMarkIcon } from '@heroicons/react/20/solid';
import type { KeyboardEvent } from 'react';
import { useState } from 'react';

import { useTasks } from '@/src/app/(main)/tasks/state/provider';
import { BackgroundColors } from '@/src/lib/colors';
import type { Task } from '@/types/main';

interface TagsProps {
  listColor: string;
  taskData: Task;
}

export const TagsWrapper = ({ listColor, taskData }: TagsProps) => {
  const { handleUpdateTask } = useTasks();
  const [tagList, setTagList] = useState<string[]>(taskData?.tags || []);
  const [tagInput, setTagInput] = useState<string>('');

  const handleDeleteTag = async (tagToDelete: string) => {
    const newTagList = tagList.filter((tag) => tag !== tagToDelete);
    setTagList(newTagList);
    await handleUpdateTask({ ...taskData, tags: newTagList })();
  };

  const handleAddTag = async (event: KeyboardEvent<HTMLInputElement>) => {
    const newTag = tagInput.trim();
    if (event.key === 'Enter' && newTag !== '' && !tagList?.includes(newTag)) {
      const newTagList = [...tagList, newTag];
      setTagList([...tagList, newTag]);
      setTagInput('');
      await handleUpdateTask({ ...taskData, tags: newTagList })();
    }
  };

  return (
    <section className="flex h-fit flex-wrap gap-1 rounded-2xl bg-gray-100 p-4">
      {tagList.map((tag) => (
        <div
          key={tag}
          className={`rounded-md ${BackgroundColors.get(listColor)} flex items-center 
          justify-center pl-3 pr-1 align-middle text-white`}
        >
          {tag}
          <button
            type="button"
            className="ml-2 self-center rounded-md text-gray-600 hover:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-white"
            onClick={() => handleDeleteTag(tag)}
          >
            <span className="sr-only">Close panel</span>
            <XMarkIcon className="size-4" color="white" aria-hidden="true" />
          </button>
        </div>
      ))}
      <input
        maxLength={20}
        placeholder="Include new Tag"
        className="z-10 appearance-none overflow-hidden
                    bg-transparent px-2 text-base outline-0 focus:outline-none"
        onChange={(e) => setTagInput(e.target.value)}
        value={tagInput}
        onKeyDown={handleAddTag}
      />
    </section>
  );
};

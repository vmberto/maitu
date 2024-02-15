import { Listbox, Transition } from '@headlessui/react';
import { DocumentTextIcon, MapPinIcon } from '@heroicons/react/20/solid';
import { type Dispatch, Fragment, type SetStateAction, useMemo } from 'react';

export enum Section {
  DESCRIPTION = 0,
  LOCATION = 1,
}

export const sections = [
  {
    id: Section.DESCRIPTION,
    name: 'Description',
    icon: <DocumentTextIcon className="size-5" aria-hidden="true" />,
  },
  {
    id: Section.LOCATION,
    name: 'Location',
    icon: <MapPinIcon className="size-5" aria-hidden="true" />,
  },
];

interface SectionSelectProps {
  selectedSections: Section[];
  setSection: Dispatch<SetStateAction<Section[]>>;
}

export function SectionSelect({
  selectedSections,
  setSection,
}: SectionSelectProps) {
  const availableSections = useMemo(
    () => sections.filter((section) => !selectedSections.includes(section.id)),
    [selectedSections],
  );

  return (
    <Listbox>
      {({ open }) => (
        <div
          className={`relative ${
            selectedSections.length > 0 ? 'mt-8' : 'mt-0'
          }`}
        >
          <Listbox.Button
            className="relative w-full cursor-default rounded-md bg-white p-1.5
                        text-center font-semibold uppercase text-gray-900 shadow-sm ring-1 ring-inset
                        ring-gray-300 focus:outline-none sm:text-sm sm:leading-6 betterhover:hover:bg-gray-100"
          >
            Add Section
          </Listbox.Button>

          <Transition
            show={open}
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options
              className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md
                            bg-white py-1 text-base shadow-lg ring-1 ring-black/5
                            focus:outline-none sm:text-sm"
            >
              {availableSections.map((section) => (
                <Listbox.Option
                  key={section.name}
                  className="relative cursor-default select-none py-2 pl-3 pr-9 betterhover:hover:bg-gray-100"
                  value={section}
                  onClick={() => {
                    setSection(
                      [...selectedSections, section.id].sort((a, b) => a - b),
                    );
                  }}
                >
                  <div className="flex items-center">
                    {section.icon}
                    <span className="ml-3 block truncate">{section.name}</span>
                  </div>
                </Listbox.Option>
              ))}
              {availableSections.length === 0 && (
                <Listbox.Option
                  className="relative cursor-default select-none py-2 pl-3 pr-9"
                  value={null}
                >
                  <div className="flex items-center">No Available Section</div>
                </Listbox.Option>
              )}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  );
}

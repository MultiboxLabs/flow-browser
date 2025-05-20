import { Fragment, useEffect, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { VscChevronDown, VscEdit } from "@/components/react-icons/vsc";
import { AnnotationEditorType, AnnotationEditorParamsType } from "pdfjs-dist";
import { default as colors, colorNames, colorStrengths } from "../colors";
import type { TUsePDFSlickStore } from "@pdfslick/react";

type InkMenuProps = {
  usePDFSlickStore: TUsePDFSlickStore;
};

const InkMenu = ({ usePDFSlickStore }: InkMenuProps) => {
  const pdfSlick = usePDFSlickStore((s) => s.pdfSlick);
  const annotationEditorMode = usePDFSlickStore((s) => s.annotationEditorMode);
  const isInkMode = annotationEditorMode === AnnotationEditorType.INK;

  const [opacity, setOpacity] = useState(100);
  const [thickness, setThickness] = useState(1);

  useEffect(() => {
    if (pdfSlick) {
      pdfSlick.setAnnotationEditorParams([
        {
          type: AnnotationEditorParamsType.INK_THICKNESS,
          value: thickness
        }
      ]);
    }
  }, [pdfSlick, thickness]);

  useEffect(() => {
    if (pdfSlick) {
      console.log("setting opacity", opacity);
      pdfSlick.setAnnotationEditorParams([
        {
          type: AnnotationEditorParamsType.INK_OPACITY,
          value: opacity
        }
      ]);
    }
  }, [pdfSlick, opacity]);

  return (
    <div
      className={`flex items-center rounded-sm group ${isInkMode ? "dark:bg-blue-700 bg-blue-100" : "hover:dark:bg-slate-600 hover:bg-slate-200/50"}`}
    >
      <button
        className={` enabled:hover:dark:text-slate-100 enabled:hover:text-black dark:text-slate-300 text-slate-600 p-1 disabled:dark:text-slate-500 disabled:text-slate-300 rounded-sm transition-all group relative focus:border-blue-400 focus:ring-0 focus:shadow outline-none border border-transparent`}
        onClick={() => {
          const mode = isInkMode ? AnnotationEditorType.NONE : AnnotationEditorType.INK;
          pdfSlick?.setAnnotationEditorMode(mode);
        }}
      >
        <VscEdit className="w-4 h-4" />
      </button>

      <Menu as="div" className="text-xs relative">
        <Menu.Button
          disabled={!pdfSlick}
          className={`h-6 enabled:group-hover:hover:dark:bg-slate-500 enabled:group-hover:hover:bg-slate-200 enabled:hover:dark:text-slate-100 enabled:hover:text-black dark:text-slate-300 text-slate-500 disabled:dark:text-slate-500 disabled:text-slate-300 rounded-sm transition-all focus:border-blue-400 focus:ring-0 focus:shadow outline-none border border-transparent`}
        >
          <div className="p-0.5">
            <VscChevronDown className="w-3 h-3" />
          </div>
        </Menu.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-30 mt-2 origin-top-right rounded-sm text-left dark:bg-slate-700 bg-white dark:divide-slate-500 divide-y divide-slate-200 shadow-lg ring-1 dark:ring-white/10 ring-black/5 focus:outline-none">
            <div className="flex flex-col space-y-1 p-2">
              <div className="text-sm font-medium dark:text-slate-200 text-gray-900 py-1">Color</div>
              {colorStrengths.map((s) => (
                <div className="flex space-x-1" key={s}>
                  {colorNames.map((name) => (
                    <button
                      key={`${name}-${s}`}
                      className="p-2 block rounded-full origin-center border border-transparent hover:scale-125 hover:border-blue-300"
                      style={{
                        backgroundColor: colors[name][s]
                      }}
                      onClick={() => {
                        pdfSlick?.setAnnotationEditorMode(AnnotationEditorType.INK);
                        pdfSlick?.setAnnotationEditorParams([
                          {
                            type: AnnotationEditorParamsType.INK_COLOR,
                            value: colors[name][s]
                          }
                        ]);
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>

            <div className="p-2 flex flex-col">
              <div className="py-1 flex space-x-2 items-center">
                <label htmlFor="innkThickness" className="text-sm w-20 font-medium dark:text-slate-200 text-gray-900">
                  Thickness
                </label>
                <div className="w-full flex flex-1 items-center">
                  <input
                    className="w-full h-1.5 dark:bg-slate-600 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    defaultValue={1}
                    value={thickness}
                    type="range"
                    min={1}
                    max={100}
                    onChange={(e) => {
                      setThickness(+e.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="py-1 flex space-x-2 items-center">
                <label htmlFor="inkOpacity" className="text-sm w-20 font-medium dark:text-slate-200 text-gray-900">
                  Opacity
                </label>
                <div className="w-full flex flex-1 items-center">
                  <input
                    className="w-full h-1.5 dark:bg-slate-600 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    defaultValue={100}
                    value={opacity}
                    type="range"
                    min={0}
                    max={100}
                    onChange={(e) => {
                      setOpacity(+e.target.value);
                    }}
                  />
                </div>
              </div>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
};

export default InkMenu;

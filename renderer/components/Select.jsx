import React from "react"
import { CircleArrowDown } from "./SVGs";

const isOutOfViewport = (elem) => {
	var bounding = elem.getBoundingClientRect();

	var out = {};
	out.top = bounding.top < 0;
	out.left = bounding.left < 0;
	out.bottom = bounding.bottom > (window.innerHeight || document.documentElement.clientHeight);
	out.right = bounding.right > (window.innerWidth || document.documentElement.clientWidth);
	out.any = out.top || out.left || out.bottom || out.right;
	out.all = out.top && out.left && out.bottom && out.right;

	return out;
};

export function Select({ items, className, value, setValue, onChange }) {
  const [ open, setOpen ] = React.useState(false);
  const [ menuPos, setMenuPos ] = React.useState(`-${(items.filter(x => !x.seperator).length * 28) + (items.filter(x => x.seperator).length * 5) + 16}px`);
  const [ internalValue, setInternalValue ] = React.useState({});

  const ref = React.useRef(null);
  const optionsRef = React.useRef(null);

  var listener = false;

  const toggleMenu = () => {
    if(optionsRef.current === null) return;

    var out = isOutOfViewport(optionsRef.current);

    if(out.bottom === true) {
      setMenuPos(`42px`);
      return;
    }
    
    console.log(`-${(items.filter(x => !x.seperator).length * 28) + (items.filter(x => x.seperator).length * 5) + 16}px`);
    console.log(optionsRef.current.offsetHeight);

    setMenuPos(`-${(items.filter(x => !x.seperator).length * 28) + (items.filter(x => x.seperator).length * 5) + 16}px`);
    setOpen(!open);
  }

  React.useEffect(() => {
    if(!listener) {
      document.addEventListener("mouseup", (event) => {
        if(ref.current && !ref.current.contains(event.target) && event.target !== ref.current) {
          setOpen(false);
        }
      });
      listener = true;
    }
  }, []);
  //24
  React.useEffect(onChange, [value]);

  React.useEffect(() => {
    if(Object.keys(internalValue).length > 0 && value !== internalValue.value) {
      var val = items.find(x => x.value === value);
      setInternalValue(val);
    }
  }, [value])

  React.useEffect(() => {
    if(items[0]) {
      setValue(items[0].value);
      setInternalValue(items[0]);
    }
  }, []);

  return (
    <div className={"inline-block relative h-10 rounded top-1 " + (className ? className : '')} ref={ref}>
      <div className={`group button select relative w-full text-left inline-block py-3 align-baseline ${open === true ? 'opened' : ''}`} onClick={() => { toggleMenu() }}>
        <span className="block relative bottom-1 w-full text-left px-4">{internalValue.text}</span>
        <CircleArrowDown className={`w-6 h-6 absolute right-2 top-1.5 transition-all duration-100 ease-linear group-hover:text-white ${open ? "rotate-180 text-white" : "text-button-color"}`} />
      </div>
      <div 
        className={`w-full absolute left-0 h-auto flex-col border-2 border-tile-color bg-maincolor-light drop-shadow-2xl shadow-2xl p-2 rounded ${open === true ? 'flex' : "hidden"}`}
        style={{ bottom: menuPos }}
        ref={optionsRef}
      >
        {items.map((item, index) => {
          if(item.seperator) {
            return (
              <hr key={index} className="mb-1" />
            )
          }
          return (
            <span 
              key={index} 
              className={`rounded pl-2 ${index+1 === items.length ? null : 'mb-1'} ${item.disabled === true ? 'hover:bg-gray-500 cursor-default' : 'hover:bg-button-color-hover cursor-pointer'}`}
              onClick={() => {
                if(item.disabled) return;
                setValue(item.value);
                setInternalValue(item);
                setOpen(false);
              }}
            >
              {item.text}
            </span>
          )
        })}
      </div>
    </div>
  )
}
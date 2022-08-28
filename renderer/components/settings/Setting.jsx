export default function Setting({ title, desc, desc2, inputType, buttonText, isChecked, onClick, id, isDisabled, inputVal, setInputVal, extraButton, extraButtonText, extraButtonClick }) {
  return (
    <div className="flex flex-row items-center ml-4 mt-2 mb-4">
      <div className="">
        <label htmlFor={(title.toLowerCase().replace(" ", "-")) + "tray-valtracker"} className={"block text-lg mb-2 transition-all duration-100 ease-linear " + (isDisabled ? "text-gray-400" : '')}>{title}</label>
        <span className={"text-gray-500"}>{desc}</span> <br />
        {desc2 ? <span className={"text-gray-500 relative bottom-1"}>{desc2}</span> : null}
      </div>
      <div className="ml-auto relative mr-28 w-52">
        { inputType == "checkbox" ?
          <label className={"switch absolute right-0 " + (isDisabled ? 'disabled' : '') } id="valtracker-closing-behavior-switch">
            <input type='checkbox' id={(title.toLowerCase().replace(" ", "-")) + "tray-valtracker"} name={(title.toLowerCase().replace(" ", "-")) + "tray-valtracker"} checked={isChecked} readOnly onClick={onClick} disabled={isDisabled} />
            <span className={"slider round absolute right-0 " + (isDisabled? 'disabled' : '')}></span>
          </label>
          :
          ('')
        }
        { inputType == "button" ?
          <button onClick={onClick} id={id ? id : ''} className="w-full">{buttonText}</button>
          :
          ('')
        }
        { inputType == "text" ?
          <input 
            value={inputVal}
            onChange={(e) => { setInputVal(e.target.value) }}
            type='text' 
            className="bg-button-color focus:outline-none text-sm z-40 font-light placeholder:text-white hover:bg-button-color-hover hover:shadow-2xl h-8 ml-px w-full flex items-center px-2 py-1 rounded-sm cursor-pointer transition-all ease-in duration-100 focus:bg-button-color-hover outline-none"
          />
          :
          ('')
        }
        { extraButton ?
          <button className='mt-2 w-full' onClick={ inputVal.length > 0 ? extraButtonClick : null } id={id ? id : ''}>{extraButtonText}</button>
          :
          ('')
        }
      </div>
    </div>
  )
}
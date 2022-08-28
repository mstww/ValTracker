export default function Setting({ title, desc, desc2, inputType, buttonText, isChecked, onClick, id, isDisabled }) {
  return (
    <div className="flex flex-row items-center ml-4 mt-2 mb-4">
      <div className="">
        <label htmlFor={(title.toLowerCase().replace(" ", "-")) + "tray-valtracker"} className={"block text-lg mb-2 transition-all duration-100 ease-linear " + (isDisabled ? "text-gray-400" : '')}>{title}</label>
        <span className={"text-gray-500"}>{desc}</span> <br />
        {desc2 ? <span className={"text-gray-500 relative bottom-1"}>{desc2}</span> : null}
      </div>
      <div className="ml-auto mr-28">
        { inputType == "checkbox" ?
          <label className={"switch " + (isDisabled ? 'disabled' : '') } id="valtracker-closing-behavior-switch">
            <input type='checkbox' id={(title.toLowerCase().replace(" ", "-")) + "tray-valtracker"} name={(title.toLowerCase().replace(" ", "-")) + "tray-valtracker"} checked={isChecked} readOnly onClick={onClick} disabled={isDisabled} />
            <span className={"slider round " + (isDisabled? 'disabled' : '')}></span>
          </label>
          :
          ('')
        }
        { inputType == "button" ?
          <button onClick={onClick} id={id ? id : ''}>{buttonText}</button>
          :
          ('')
        }
      </div>
    </div>
  )
}
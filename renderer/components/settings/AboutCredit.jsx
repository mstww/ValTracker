import { shell } from 'electron';
export default function AboutCredit({ url, text }) {
  const openExternalLink = (link) => {
    shell.openExternal(link);
  }

  return(
    <div>
      
      <span 
        onClick={() => { openExternalLink(url) }}
        className='underline cursor-pointer hover:text-button-color-hover transition-all ease-in duration-75 text-gray-300'
      >
        {text}
      </span>
    </div>
  )
}
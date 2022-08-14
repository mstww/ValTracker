export default function SettingsWrapper({ children, type, activeWrapper }) {
  return (
    <div 
      id={'settings-' + type} 
      className={'' + (activeWrapper == type ? 'block' : 'hidden')}
    >
      { children }
    </div>
  )
}
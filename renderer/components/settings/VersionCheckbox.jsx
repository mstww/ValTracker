export default function VersionCheckbox({ version, selectedVersion, click }) {
  return (
    <div className='version-selector relative h-auto p-2 rounded transition-all duration-[0ms] ease-linear cursor-pointer m-1 ml-0 mr-2' key={version}>
      <input type={'checkbox'} id={version} name={version} />
      <span className={(selectedVersion === version ? 'active' : '')} onClick={click}>{version}</span>
    </div>
  )
}
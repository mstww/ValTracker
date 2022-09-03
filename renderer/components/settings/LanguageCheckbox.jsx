export default function LanguageCheckbox({ locale, selectedLang, displayName, click }) {
  return (
    <div className='language-checkbox' key={locale}>
      <input type={'checkbox'} id={locale} name={locale} />
      <span className={(selectedLang === locale ? 'active' : '')} onClick={click}>{displayName}</span>
    </div>
  )
}
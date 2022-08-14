import React from 'react';
import { Tooltip } from '@nextui-org/react';
import { shell } from 'electron';

export default function SocialsIcon({ icon, tooltip, href }) {

  const openInShell = (href) => {
    shell.openExternal(href);
  }

  return(
    <Tooltip content={tooltip} color="error" placement={'top'} className='rounded-sm'>
      <div className='hover:bg-button-color-hover p-1 rounded-sm cursor-pointer transition-all ease-in duration-100' onClick={() => {openInShell(href)}}>
        <img src={icon} className='w-6 h-6 p-px' />
      </div>
    </Tooltip>
  )
}
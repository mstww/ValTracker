import React from 'react';
import { Tooltip } from '@nextui-org/react';
import { shell } from 'electron';
import { Coffee, Discord, GitHub, Twitter } from '../SVGs';

export default function SocialsIcon({ icon, tooltip, href }) {

  const openInShell = (href) => {
    shell.openExternal(href);
  }

  return(
    <Tooltip content={tooltip} color="error" placement={'top'} className='rounded'>
      <div className='hover:bg-button-color-hover p-1 rounded cursor-pointer transition-all ease-in duration-100' onClick={() => {openInShell(href)}}>
        { icon === '/images/coffee.svg' ? <Coffee cls='w-6 h-6 p-px' /> : null }
        { icon === '/images/discord.svg' ? <Discord cls='w-6 h-6 p-px' /> : null }
        { icon === '/images/twitter.svg' ? <Twitter cls='w-6 h-6 p-px' /> : null }
        { icon === '/images/github.svg' ? <GitHub cls='w-6 h-6 p-px' /> : null }
      </div>
    </Tooltip>
  )
}
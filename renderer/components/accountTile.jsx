import React from 'react';
import { useRouter } from 'next/router';
import { switchPlayer } from '../js/dbFunctions';

export default function AccountTile({ currenttier, puuid, username, usertag, userregion, active_account, setSwitchToggle }) {
  const router = useRouter();

  const switchAccount = async (event) => {
    var puuidToBeSwitchedTo = event.target.id;
    
    await switchPlayer(puuidToBeSwitchedTo);
    
    sessionStorage.removeItem('navbar-rank');
    setSwitchToggle(current => !current);
    router.push(router.route + '?account=' + puuidToBeSwitchedTo + `&lang=${router.query.lang}`);
  }

  return (
    <li 
      className={
        'flex flex-row items-center content-center h-1/6 mb-2 justify-start border rounded transition-all ease-in duration-100 border-tile-color'
        + (active_account ? ' border-gradient-left active-riot-acc' : ' hover:bg-tile-color border-tile-color cursor-pointer')
      }
      id={ puuid }
      onClick={ async (e) => { active_account ? null : switchAccount(e) } }
    >
      <img 
        src={currenttier}
        className='w-9 p-1 mr-2 ml-1 rounded-full border border-gray-500 my-1 pointer-events-none'
        id='navbar-account-switcher-rank shadow-img'
      /> 
      <div className='flex flex-col justify-center pointer-events-none'>
        <span className='m-0 leading-none mb-px pointer-events-none'>{ username }</span>
        <span className='text-gray-500 font-light leading-none pointer-events-none'>#{ usertag }</span>
      </div>
      <span className='ml-auto mr-4 pointer-events-none'>{ userregion.toUpperCase() }</span>
    </li>
  )
}
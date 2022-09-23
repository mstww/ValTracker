import React from "react";
import { Spacer } from "@nextui-org/react";
import fs from 'fs';
import { motion } from "framer-motion";
import moment from "moment";
import L from '../locales/translations/wishlist.json';
import LocalText from "../components/translation/LocalText";
import { useRouter } from "next/router";
import { ArrowRoundUp, StarFilled } from "../components/SVGs";
import Layout from '../components/Layout';

const scoreboard_vars_initial = {
  hidden: { opacity: 0, x: -200, y: 0, scale: 1, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, scale: 1, display: '' },
  exit: { opacity: 0, x: 200, y: 0, scale: 1, transitionEnd: { display: 'none' } },
}

export default function Wishlist({ isNavbarMinimized }) {
  const router = useRouter();
  
  const [ currentSortStat, setCurrentSortStat ] = React.useState('');

  const [ playerWishlistSkins, setPlayerWishlistSkins ] = React.useState([]);
  const [ unsortedPlayerWishlistSkins, setUnsortedPlayerWishlistSkins ] = React.useState([]);

  const [ userData, setUserData ] = React.useState({});

  React.useEffect(() => {
    var user_data = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json'));
    var data = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/wishlists/' + user_data.playerUUID + '.json'));

    setUserData(user_data);

    setUnsortedPlayerWishlistSkins(data.skins);
    setPlayerWishlistSkins(data.skins);
  }, []);
  
  return (
    <Layout isNavbarMinimized={isNavbarMinimized}>
      <div className="p-4">
        {
          playerWishlistSkins.length > 0 
          ?
          <table className="w-full" id="scoreboard-table">
            <tbody id="test-scoreboard">
              <tr className="scoreboard-header">
                <td className="w-1/6 relative left-1">{LocalText(L, "headers.skin")}</td>
                <td className={"w-10%"} onClick={() => {
                  setCurrentSortStat('price');

                  var newArray = playerWishlistSkins.sort(function(a, b) {
                    return b.price - a.price;
                  });

                  setPlayerWishlistSkins(newArray);
                }}>
                  <span className='cursor-pointer'>{LocalText(L, "headers.price")}</span>
                  {
                    currentSortStat === 'price' ?
                    <ArrowRoundUp cls='w-5 ml-2 mb-0.5 inline shadow-img' />
                    :
                    null
                  }
                </td>
                <td className={"w-1/6"} onClick={() => {
                  setCurrentSortStat('wishedAt');

                  var newArray = playerWishlistSkins.sort(function(a, b) {
                    return b.wishlistedAt - a.wishlistedAt;
                  });

                  setPlayerWishlistSkins(newArray);
                }}>
                  <span className='cursor-pointer'>{LocalText(L, "headers.wishlisted_on")}</span>
                  {
                    currentSortStat === 'wishedAt' ?
                    <ArrowRoundUp cls='w-5 ml-2 mb-0.5 inline shadow-img' />
                    :
                    null
                  }
                </td>
                <td className={"w-10%"} onClick={() => {
                  setCurrentSortStat('daysSince');

                  var newArray = playerWishlistSkins.sort(function(a, b) {
                    return a.wishlistedAt - b.wishlistedAt;
                  });

                  setPlayerWishlistSkins(newArray);
                }}>
                  <span className='cursor-pointer'>{LocalText(L, "headers.days_since")}</span>
                  {
                    currentSortStat === 'daysSince' ?
                    <ArrowRoundUp cls='w-5 ml-2 mb-0.5 inline shadow-img' />
                    :
                    null
                  }
                </td>
                <td className={"w-10%"}>
                  <span className=''>{LocalText(L, "headers.remove")}</span>
                </td>
              </tr>
              <Spacer y={0.5} />

              {playerWishlistSkins.map((skin, index) => {
                moment.locale(router.query.lang);
                var dateAdded = moment(skin.wishlistedAt).format('D. MMMM, YYYY');
                var daysSinceAdded = Math.abs(moment().diff(parseInt(skin.wishlistedAt), 'days'));
                return (
                  <>
                    <motion.tr 
                      className={'border-2 border-maincolor-lightest rounded'} key={index + 'tr'}
                      variants={scoreboard_vars_initial}
                      initial="hidden"
                      enter="enter"
                      exir="exit"
                      transition={{ type: 'linear', duration: 0.5, delay: (index / 100) }}
                    >
                      <td className='py-1 pl-1 flex flex-col items-center min-h-20'>
                        <div className="w-full flex items-center justify-center h-12 relative top-0 right-5">
                          <img src={skin.displayIcon} className='shadow-img max-h-full transform scale-90' />
                        </div>
                        <span className={'ml-4 text-lg font-light relative right-5 text-center'}>{skin.displayName}</span>
                      </td>
                      <td className={'py-1 text-xl'}>
                        <div className="inline-flex flex-row items-center w-full">
                          <span className="w-10 text-right relative top-px">{skin.price}</span>
                          <img src="/images/vp_icon.png" className="w-6 ml-2 mr-auto" />
                        </div>
                        </td>
                      <td className={'py-1 text-xl'}><span>{dateAdded}</span></td>
                      <td className={'py-1 text-xl'}><span>{daysSinceAdded}</span></td>
                      <td className={'py-1 text-xl'}>
                        <button 
                          className="flex items-center"
                          onClick={() => {
                            for(var i = 0; i < unsortedPlayerWishlistSkins.length; i++) {
                              if(unsortedPlayerWishlistSkins[i].uuid === skin.uuid) {
                                delete unsortedPlayerWishlistSkins[index];
                                var newArray1 = unsortedPlayerWishlistSkins.filter(value => Object.keys(value).length !== 0);
                              }
                            }

                            delete playerWishlistSkins[index];
                            var newArray2 = playerWishlistSkins.filter(value => Object.keys(value).length !== 0);
                            
                            var data = {
                              "skins": newArray1
                            }

                            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/wishlists/' + userData.playerUUID + '.json', JSON.stringify(data));
                            setPlayerWishlistSkins(newArray1);
                            setUnsortedPlayerWishlistSkins(newArray2);
                          }}
                        >
                          <StarFilled cls='w-5 relative bottom-px mr-1' />
                          {LocalText(L, "content.remove_button_text")}
                        </button>
                      </td>
                    </motion.tr>
                    <Spacer y={0.2} key={index + 'spacer'} />
                  </>
                )
              })}
            </tbody>
          </table>
          : 
          <div className="w-full text-center">{LocalText(L, "content.empty_text")}</div>
        }
      </div>
    </Layout>
  )
}
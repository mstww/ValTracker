import React from "react";
import { Spacer } from "@nextui-org/react";
import { motion } from "framer-motion";
import moment from "moment";
import L from '../locales/translations/wishlist.json';
import LocalText from "../components/translation/LocalText";
import { useRouter } from "next/router";
import { ArrowRoundUp, StarFilled } from "../components/SVGs";
import Layout from '../components/Layout';
import { executeQuery, getCurrentUserData, rmSkinFromWishlist } from "../js/dbFunctions";

const scoreboard_vars_initial = {
  hidden: { opacity: 0, x: -200, y: 0, scale: 1, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, scale: 1, display: '' },
  exit: { opacity: 0, x: 200, y: 0, scale: 1, transitionEnd: { display: 'none' } },
}

export default function Wishlist({ isNavbarMinimized, isOverlayShown, setIsOverlayShown }) {
  const router = useRouter();
  
  const [ currentSortStat, setCurrentSortStat ] = React.useState('');

  const [ playerWishlistSkins, setPlayerWishlistSkins ] = React.useState([]);
  const [ unsortedPlayerWishlistSkins, setUnsortedPlayerWishlistSkins ] = React.useState([]);

  const [ userData, setUserData ] = React.useState({});

  React.useEffect(async () => {
    var user_data = await getCurrentUserData();
    var data = await executeQuery(`SELECT * FROM wishlist:⟨${user_data.uuid}⟩`);

    setUserData(user_data);

    setUnsortedPlayerWishlistSkins(data[0].skins);
    setPlayerWishlistSkins(data[0].skins);
  }, []);
  
  return (
    <Layout isNavbarMinimized={isNavbarMinimized} setIsOverlayShown={setIsOverlayShown} isOverlayShown={isOverlayShown}>
      <div className="p-4">
        {
          playerWishlistSkins.length > 0 
          ?
          <>
            <table className="w-full" id="scoreboard-table">
              <tbody id="test-scoreboard" className="w-full">
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
                      <ArrowRoundUp className='w-5 ml-2 mb-0.5 inline shadow-img' />
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
                      <ArrowRoundUp className='w-5 ml-2 mb-0.5 inline shadow-img' />
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
                      <ArrowRoundUp className='w-5 ml-2 mb-0.5 inline shadow-img' />
                      :
                      null
                    }
                  </td>
                  <td className={"w-10%"}>
                    <span className=''>{LocalText(L, "headers.remove")}</span>
                  </td>
                </tr>
                <Spacer y={0.5} />
              </tbody>
            </table>
            <>
              {playerWishlistSkins.map((skin, index) => {
                moment.locale(router.query.lang);
                var dateAdded = moment(skin.wishlistedAt).format('D. MMMM, YYYY');
                var daysSinceAdded = Math.abs(moment().diff(parseInt(skin.wishlistedAt), 'days'));
                return (
                  <>
                    <motion.div
                      className={'flex flex-row items-center w-full h-24 overflow-hidden'} key={index + 'tr'}
                      variants={scoreboard_vars_initial}
                      initial="hidden"
                      enter="enter"
                      exir="exit"
                      transition={{ type: 'linear', duration: 0.5, delay: (index / 100) }}
                    >
                      <div className='py-1 pl-1 flex flex-col items-center justify-center border-l-2 border-t-2 border-b-2 border-maincolor-lightest bg-maincolor-lightest bg-opacity-60 w-1/4 h-full rounded-l'>
                        <div className="w-full flex items-center justify-center h-12 relative top-0 right-5">
                          <img src={skin.displayIcon} className='shadow-img max-h-full scale-90' />
                        </div>
                        <span className={'ml-4 text-lg relative right-5 text-center'}>{skin.displayName}</span>
                      </div>
                      <div className={'py-1 pl-1 border-t-2 border-b-2 border-maincolor-lightest bg-maincolor-lightest bg-opacity-60 w-1/5 h-full flex flex-col items-center justify-center'}>
                        <div className="inline-flex flex-row items-center w-full relative left-8">
                          <span className="w-10 text-right relative top-px text-lg">{skin.price}</span>
                          <img src="/images/vp_icon.png" className="w-6 ml-2 mr-auto" />
                        </div>
                      </div>
                      <div className={'py-1 text-xl border-t-2 border-b-2 border-maincolor-lightest bg-maincolor-lightest bg-opacity-60 w-1/5 h-full flex flex-col justify-center'}>
                        <span className="relative right-2.5">{dateAdded}</span>
                      </div>
                      <div className={'py-1 text-xl border-t-2 border-b-2 border-maincolor-lightest bg-maincolor-lightest bg-opacity-60 w-1/5 h-full flex flex-col justify-center items-center'}>
                        <span className="relative right-10">{daysSinceAdded}</span>
                      </div>
                      <div className={'py-1 text-xl border-t-2 border-b-2 border-r-2 rounded-r border-maincolor-lightest bg-maincolor-lightest bg-opacity-60 w-1/5 h-full flex flex-col justify-center items-center'}>
                        <button 
                          className="flex items-center relative right-9"
                          onClick={async () => {
                            for(var i = 0; i < unsortedPlayerWishlistSkins.length; i++) {
                              if(unsortedPlayerWishlistSkins[i].uuid === skin.uuid) {
                                await rmSkinFromWishlist(unsortedPlayerWishlistSkins[index]);
                                
                                delete unsortedPlayerWishlistSkins[index];
                                var newArray1 = unsortedPlayerWishlistSkins.filter(value => Object.keys(value).length !== 0);
                              }
                            }

                            delete playerWishlistSkins[index];
                            var newArray2 = playerWishlistSkins.filter(value => Object.keys(value).length !== 0);

                            setPlayerWishlistSkins(newArray1);
                            setUnsortedPlayerWishlistSkins(newArray2);
                          }}
                        >
                          <StarFilled className='w-5 relative bottom-px mr-1' />
                          {LocalText(L, "content.remove_button_text")}
                        </button>
                      </div>
                    </motion.div>
                    <Spacer y={0.2} key={index + 'spacer'} />
                  </>
                )
              })}
            </>
          </>
          
          : 
          <div className="w-full text-center">{LocalText(L, "content.empty_text")}</div>
        }
      </div>
    </Layout>
  )
}
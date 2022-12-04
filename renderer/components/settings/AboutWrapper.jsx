import { motion } from "framer-motion"

const variants = {
  hidden: { opacity: 0, x: 0, y: -50 },
  enter: { opacity: 1, x: 0, y: 0 },
  exit: { opacity: 0, x: 0, y: -50 },
}

export default function AboutWrapper({ children }) {
  return (
    <motion.div 
      className={"mb-6"}
      variants={variants}
      initial="hidden"
      animate="enter"
      exit="exit"
      transition={{ type: 'ease-in', duration: 0.2 }}
    >
      <span className={"text-gray-500 font-bold text-lg"}>ABOUT</span>
      <div className="ml-4 mt-2">
        {children}
      </div>
    </motion.div>
  )
}
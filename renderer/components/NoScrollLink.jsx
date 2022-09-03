import Link from 'next/link'
import { useRouter } from 'next/router';

export default function NoScrollLink({ children, href, passHref }) {
  const router = useRouter();
  
  return <Link href={href + '?lang=' + router.query.lang} passHref={passHref} scroll={false}>{children}</Link>
}
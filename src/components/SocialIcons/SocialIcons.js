import React from "react"
import { Typography } from "antd";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiscord, faWeixin, faTelegram, faMediumM, faRedditAlien, faBitcoin, faTwitter, faFacebook, faYoutube } from '@fortawesome/free-brands-svg-icons';

const { Text } = Typography;

export const SocialIcons = ({size = "full", centered = false}) => { // type full or short

  const links = [
    {
      name: "discord",
      icon: faDiscord,
      link: "https://discord.obyte.org/"
    },
    {
      name: "telegram",
      icon: faTelegram,
      link: "https://t.me/obyteorg",
    },
    {
      name: "weixin",
      icon: faWeixin,
      link: "https://mp.weixin.qq.com/s/JB0_MlK6w--D6pO5zPHAQQ"
    },
    {
      name: "twitter",
      icon: faTwitter,
      link: "https://twitter.com/ObyteOrg"
    },
    {
      name: "youtube",
      icon: faYoutube,
      link: "https://www.youtube.com/channel/UC59w9bmROOeUFakVvhMepPQ/"
    },
    {
      name: "medium",
      icon: faMediumM,
      link: "https://blog.obyte.org"
    },
    {
      name: "reddit",
      icon: faRedditAlien,
      link: "https://www.reddit.com/r/obyte/"
    },
    {
      name: "bitcoin",
      icon: faBitcoin,
      link: "https://bitcointalk.org/index.php?topic=1608859.0"
    },
    {
      name: "facebook",
      icon: faFacebook,
      link: "https://www.facebook.com/obyte.org"
    }
  ];


  return (<div style={{ textAlign: "center", fontSize: 14 }}>
    {size === "full" && <div style={{ marginBottom: 10 }}><Text type="secondary">Join the community, get help:</Text></div>}
    <div style={{ display: "flex", justifyContent: centered ? "center" : "flex-start", flexWrap: "wrap", alignItems: "center", fontSize: 18 }}>
      {(size === "full" ? links : links.slice(0, 5)).map((social) => <a style={{ margin: "5px 10px", color: "#1e90ff" }} key={"link-" + social.name} target="_blank" rel="noopener" href={social.link} ><FontAwesomeIcon size="lg" icon={social.icon} /></a>)}
    </div>
  </div>)
}
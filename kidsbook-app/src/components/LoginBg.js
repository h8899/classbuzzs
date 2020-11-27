import React, { Component } from 'react';
import imgBg from '../assets/bg/bg.png';
import imgCloudBottom from '../assets/bg/cloud_bottom.svg';
import imgCloudTop from '../assets/bg/cloud_top.svg';
import imgMoon from '../assets/bg/moon.svg';
import imgPlanet from '../assets/bg/planet.svg';
import imgRocket from '../assets/bg/rocket.svg';
import imgAstro from '../assets/bg/astro.svg';

const background = (url, size) => ({
    backgroundImage: `url('${url}')`,
    backgroundPosition: 'center',
    backgroundSize: size,
    backgroundRepeat: 'no-repeat'
});

const generate = (widthPercentage, ratio) => ({
    width: `${widthPercentage * 100}%`,
    paddingBottom: `${ratio * widthPercentage * 100}%`
});

class LoginBg extends Component {
    render() {
        return (
            <div
                style={{
                    ...background(imgBg, 'cover'),
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                <div
                    style={{
                        ...generate(0.3, 1),
                        ...background(imgCloudBottom, '100% 100%'),
                        bottom: 0,
                        right: 0,
                        position: 'absolute'
                    }}
                />
                <div
                    style={{
                        ...generate(0.06, 1),
                        ...background(imgPlanet, 'contain'),
                        top: '30%',
                        left: '20%',
                        position: 'absolute',
                        filter: 'drop-shadow(0 0 5px orange)'
                    }}
                />
                <div
                    style={{
                        ...generate(0.3, 0.8015),
                        ...background(imgCloudTop, '100% 100%'),
                        top: 0,
                        left: 0,
                        position: 'absolute'
                    }}
                />
                <div
                    style={{
                        ...generate(0.3, 0.8015),
                        ...background(imgCloudTop, '100% 100%'),
                        top: 0,
                        left: 0,
                        position: 'absolute'
                    }}
                />
                <div
                    style={{
                        ...generate(0.15, 1),
                        ...background(imgMoon, 'contain'),
                        top: '10%',
                        right: '18%',
                        position: 'absolute',
                        filter: 'drop-shadow(0 0 10px white)'
                    }}
                />
                <div
                    className="anim-float"
                    style={{
                        ...generate(0.1, 1.2014),
                        ...background(imgRocket, 'contain'),
                        bottom: '10%',
                        right: '10%',
                        position: 'absolute',
                        animationDelay: '2s',
                        animationDuration: '4.5s'
                    }}
                />
                <div
                    className="anim-float"
                    style={{
                        ...generate(0.35, 0.4287),
                        ...background(imgAstro, 'contain'),
                        bottom: '10%',
                        left: '10%',
                        position: 'absolute'
                    }}
                />
            </div>
        );
    }
}

export default LoginBg;

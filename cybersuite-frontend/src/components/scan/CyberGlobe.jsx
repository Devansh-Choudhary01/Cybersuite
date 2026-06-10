import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// Convert lat/lon to 3D position
function latLonTo3D(lat, lon, r = 1.0) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  )
}

function createTextSprite(text, fontSize = 24, scaleY = 0.04, color = 'rgba(255,255,255,0.3)') {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.font = `600 ${fontSize}px "Inter", monospace`
  const w = ctx.measureText(text).width
  canvas.width = w + 20
  canvas.height = fontSize * 1.5
  
  // Re-apply after resize
  ctx.font = `600 ${fontSize}px "Inter", monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)

  const tex = new THREE.CanvasTexture(canvas)
  // Disable depth testing slightly or use depthWrite: false so it blends nicely over the surface
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.9 })
  const sprite = new THREE.Sprite(mat)
  const scaleX = (canvas.width / canvas.height) * scaleY
  sprite.scale.set(scaleX, scaleY, 1)
  return sprite
}

const MAP_LABELS = [
  // Continents (Largest, very faint)
  { text: 'NORTH AMERICA', lat: 45, lon: -100, type: 'continent' },
  { text: 'SOUTH AMERICA', lat: -15, lon: -60, type: 'continent' },
  { text: 'EUROPE', lat: 50, lon: 15, type: 'continent' },
  { text: 'AFRICA', lat: -5, lon: 20, type: 'continent' },
  { text: 'ASIA', lat: 45, lon: 90, type: 'continent' },
  { text: 'AUSTRALIA', lat: -25, lon: 135, type: 'continent' },

  // Major Countries
  { text: 'CANADA', lat: 56.1, lon: -106.3, type: 'country' },
  { text: 'UNITED STATES', lat: 39.8, lon: -98.5, type: 'country' },
  { text: 'MEXICO', lat: 23.6, lon: -102.5, type: 'country' },
  { text: 'BRAZIL', lat: -14.2, lon: -51.9, type: 'country' },
  { text: 'ARGENTINA', lat: -38.4, lon: -63.6, type: 'country' },
  { text: 'COLOMBIA', lat: 4.5, lon: -74.2, type: 'country' },
  { text: 'PERU', lat: -9.1, lon: -75.0, type: 'country' },
  
  { text: 'UNITED KINGDOM', lat: 55.3, lon: -3.4, type: 'country' },
  { text: 'FRANCE', lat: 46.2, lon: 2.2, type: 'country' },
  { text: 'GERMANY', lat: 51.1, lon: 10.4, type: 'country' },
  { text: 'ITALY', lat: 41.8, lon: 12.5, type: 'country' },
  { text: 'SPAIN', lat: 40.4, lon: -3.7, type: 'country' },
  { text: 'UKRAINE', lat: 48.3, lon: 31.1, type: 'country' },
  
  { text: 'RUSSIA', lat: 61.5, lon: 95.3, type: 'country' },
  { text: 'CHINA', lat: 35.8, lon: 104.1, type: 'country' },
  { text: 'INDIA', lat: 20.5, lon: 78.9, type: 'country' },
  { text: 'JAPAN', lat: 36.2, lon: 138.2, type: 'country' },
  { text: 'SOUTH KOREA', lat: 35.9, lon: 127.7, type: 'country' },
  { text: 'INDONESIA', lat: -0.7, lon: 113.9, type: 'country' },
  { text: 'VIETNAM', lat: 14.0, lon: 108.2, type: 'country' },

  { text: 'EGYPT', lat: 26.8, lon: 30.8, type: 'country' },
  { text: 'NIGERIA', lat: 9.0, lon: 8.6, type: 'country' },
  { text: 'SOUTH AFRICA', lat: -30.5, lon: 22.9, type: 'country' },
  { text: 'SAUDI ARABIA', lat: 23.8, lon: 45.0, type: 'country' },
  { text: 'TURKEY', lat: 38.9, lon: 35.2, type: 'country' },

  { text: 'NEW ZEALAND', lat: -40.9, lon: 174.8, type: 'country' },

  // Key States
  { text: 'California', lat: 36.7, lon: -119.4, type: 'state' },
  { text: 'Texas', lat: 31.9, lon: -99.9, type: 'state' },
  { text: 'New York', lat: 43.2, lon: -75.2, type: 'state' },
  { text: 'Florida', lat: 27.9, lon: -81.7, type: 'state' },
  { text: 'Illinois', lat: 40.0, lon: -89.0, type: 'state' },
  { text: 'Pennsylvania', lat: 41.2, lon: -77.1, type: 'state' },
  { text: 'Washington', lat: 47.7, lon: -120.7, type: 'state' },
  
  { text: 'Maharashtra', lat: 19.7, lon: 75.7, type: 'state' },
  { text: 'Karnataka', lat: 15.3, lon: 75.7, type: 'state' },
  { text: 'Delhi', lat: 28.7, lon: 77.1, type: 'state' },
  
  { text: 'New South Wales', lat: -31.2, lon: 146.9, type: 'state' },
  { text: 'Victoria', lat: -37.0, lon: 144.9, type: 'state' },
  { text: 'Queensland', lat: -20.9, lon: 142.7, type: 'state' },
  { text: 'Western Australia', lat: -25.3, lon: 122.0, type: 'state' },

  { text: 'Ontario', lat: 51.2, lon: -85.3, type: 'state' },
  { text: 'Quebec', lat: 52.9, lon: -73.5, type: 'state' },
  { text: 'Sao Paulo', lat: -23.5, lon: -46.6, type: 'state' },
]

export default function CyberGlobe({ attacks = [], is3DView = true, autoRotate = true, onRendererInit }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const animRef = useRef(null)
  const globeMesh = useRef(null)
  const attackGroup = useRef(null)
  const activeAttacks = useRef([]) // Store running animations

  useEffect(() => {
    if (!mountRef.current) return

    const W = mountRef.current.clientWidth || 1
    const H = mountRef.current.clientHeight || 1

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(window.devicePixelRatio)
    mountRef.current.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Starry Background (like Kaspersky)
    const starGeo = new THREE.BufferGeometry()
    const starCount = 1000
    const starArray = new Float32Array(starCount * 3)
    for(let i=0; i<starCount*3; i++) {
        starArray[i] = (Math.random() - 0.5) * 10
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starArray, 3))
    const starMat = new THREE.PointsMaterial({ color: 0x555555, size: 0.015, transparent: true, opacity: 0.8 })
    const stars = new THREE.Points(starGeo, starMat)
    scene.add(stars)

    // Adjust camera distance precisely based on FOV
    const fov = 40
    const aspect = W / H
    // To fit a globe of r=1.1 (with atmos), ensuring it fits horizontally and vertically
    // Vertical fit: Z = 1.1 / Math.tan(fov/2 * PI/180) = ~3.02
    // Horizontal fit: Z = (1.1 / aspect) / Math.tan(fov/2 * PI/180) = ~3.02 / aspect
    const baseDist = 1.25 / Math.tan((fov / 2) * (Math.PI / 180))
    const dist = Math.max(baseDist, baseDist / aspect)
    
    const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000)
    camera.position.set(0, 0, Math.min(dist, 10.0)) // Cap distance so it doesn't vanish

    const baseSphereObj = new THREE.Group()

    // Base Globe Texture (Kaspersky Dark Style)
    // We use a high-res earth map with dark oceans and dark grey landmasses
    const tl = new THREE.TextureLoader()
    const mapTex = tl.load('https://unpkg.com/three-globe/example/img/earth-dark.jpg')
    const bumpTex = tl.load('https://unpkg.com/three-globe/example/img/earth-topology.png')

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 64),
      new THREE.MeshPhongMaterial({
        map: mapTex,
        bumpMap: bumpTex,
        bumpScale: 0.02,
        color: 0x8899a6, // Slight tint
        transparent: true,
        opacity: 1.0,
        specular: 0x333333,
        shininess: 15,
      })
    )
    baseSphereObj.add(mesh)

    // Add labels to the globe surface
    MAP_LABELS.forEach(label => {
      let color, scale, fontSize
      if (label.type === 'continent') {
        color = 'rgba(255,255,255,0.1)'
        scale = 0.05
        fontSize = 28
      } else if (label.type === 'country') {
        color = 'rgba(0, 212, 255, 0.5)'
        scale = 0.025
        fontSize = 18
      } else { // state
        color = 'rgba(255,255,255,0.2)'
        scale = 0.015
        fontSize = 14
      }

      const sprite = createTextSprite(label.text, fontSize, scale, color)
      const pos = latLonTo3D(label.lat, label.lon, 1.01) // Just above the surface
      sprite.position.copy(pos)
      baseSphereObj.add(sprite)
    })

    // Offset for better view angle
    baseSphereObj.rotation.y = -Math.PI / 2
    baseSphereObj.rotation.x = 0.2
    
    scene.add(baseSphereObj)
    globeMesh.current = baseSphereObj

    // Outer Atmosphere Glow
    const atmos = new THREE.Mesh(
      new THREE.SphereGeometry(1.04, 64, 64),
      new THREE.MeshBasicMaterial({ 
        color: 0x223344, 
        transparent: true, 
        opacity: 0.15, 
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
      })
    )
    scene.add(atmos)

    // Attacks Group
    const aGroup = new THREE.Group()
    scene.add(aGroup)
    attackGroup.current = aGroup

    // Lighting (Kaspersky has a strong directional highlight)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
    scene.add(ambientLight)
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5)
    dirLight.position.set(5, 3, 5)
    scene.add(dirLight)

    const backLight = new THREE.DirectionalLight(0x00ff88, 0.3)
    backLight.position.set(-5, -3, -5)
    scene.add(backLight)

    const resizeNode = mountRef.current
    const ro = new ResizeObserver(() => {
      if(!resizeNode) return
      const w = resizeNode.clientWidth || 1
      const h = resizeNode.clientHeight || 1
      
      camera.aspect = w / h
      const currentDist = Math.max(baseDist, baseDist / camera.aspect)
      camera.position.z = Math.min(currentDist, 10.0)
      
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    })
    ro.observe(resizeNode)

    const animate = () => {
      animRef.current = requestAnimationFrame(animate)
      if (globeMesh.current && autoRotate && is3DView) {
        globeMesh.current.rotation.y += 0.001
      }
      if (stars && is3DView && autoRotate) {
        stars.rotation.y += 0.0002
      }
      
      // Update attack animations
      const now = Date.now()
      activeAttacks.current = activeAttacks.current.filter(atk => {
        const progress = (now - atk.startTime) / 2500
        if (progress >= 1) {
          aGroup.remove(atk.group)
          // Dispose geometry and materials to prevent memory leaks
          atk.group.traverse(child => {
            if (child.geometry) child.geometry.dispose()
            if (child.material) child.material.dispose()
          })
          return false
        }
        
        // Arc fades out at the end
        if (atk.arcMaterial) {
            atk.arcMaterial.opacity = 2.0 * (1 - progress)
            atk.arcMaterial.dashOffset -= 0.01
        }
        
        // Needles / Bars scale down and fade
        const s = 1 - Math.pow(progress, 3) // Stay tall longer, then shrink rapidly
        if (atk.sBar) { atk.sBar.scale.set(1, s, 1); atk.sBar.material.opacity = 1 - progress }
        if (atk.dBar) { atk.dBar.scale.set(1, s * 1.5, 1); atk.dBar.material.opacity = 1 - progress }

        // Particles moving along arc
        if (atk.particle && atk.curve) {
           const pt = atk.curve.getPoint(Math.min(progress * 1.5, 1.0))
           atk.particle.position.copy(pt)
           atk.particle.material.opacity = 1 - progress
        }

        // Also rotate the attack group so it stays pinned to the earth
        if (atk.group && globeMesh.current) {
          atk.group.rotation.copy(globeMesh.current.rotation)
        }

        return true
      })

      renderer.render(scene, camera)
    }
    animate()

    if (onRendererInit) onRendererInit()

    let md = false, mx=0, my=0
    resizeNode.onmousedown = (e) => { md = true; mx = e.clientX; my = e.clientY }
    window.onmouseup = () => md = false
    window.onmousemove = (e) => {
      if (!md || !is3DView) return
      if(globeMesh.current) {
        globeMesh.current.rotation.y += (e.clientX - mx) * 0.005
        globeMesh.current.rotation.x += (e.clientY - my) * 0.005
      }
      mx = e.clientX; my = e.clientY
    }

    // Touch event listeners for mobile, tablet, and iPad support
    let td = false, tx=0, ty=0
    resizeNode.ontouchstart = (e) => {
      if (e.touches.length === 1) {
        td = true
        tx = e.touches[0].clientX
        ty = e.touches[0].clientY
      }
    }
    window.ontouchend = () => td = false
    window.ontouchmove = (e) => {
      if (!td || !is3DView || e.touches.length !== 1) return
      if (globeMesh.current) {
        globeMesh.current.rotation.y += (e.touches[0].clientX - tx) * 0.005
        globeMesh.current.rotation.x += (e.touches[0].clientY - ty) * 0.005
      }
      tx = e.touches[0].clientX
      ty = e.touches[0].clientY
    }

    return () => {
      ro.disconnect()
      cancelAnimationFrame(animRef.current)
      window.onmouseup = null
      window.onmousemove = null
      window.ontouchend = null
      window.ontouchmove = null
      if (resizeNode) {
        resizeNode.onmousedown = null
        resizeNode.ontouchstart = null
        resizeNode.innerHTML = ''
      }
    }
  }, [is3DView, autoRotate])

  // Spawn new attacks
  useEffect(() => {
    if (!attacks.length || !attackGroup.current) return
    const a = attacks[attacks.length - 1] // Get latest attack
    
    // Check if we already spawned it
    if (activeAttacks.current.find(x => x.id === a.id)) return

    const g = new THREE.Group()

    const riskColor = a.risk === 'critical' ? 0xff2d55 :
                      a.risk === 'high' ? 0xff00aa :
                      a.risk === 'medium' ? 0x00d4ff : 0x00ff88

    const srcPos = latLonTo3D(a.src.lat, a.src.lon, 1.001)
    const dstPos = latLonTo3D(a.dst.lat, a.dst.lon, 1.001)

    // Glowing Arc
    const curve = new THREE.QuadraticBezierCurve3(
        srcPos.clone(),
        srcPos.clone().lerp(dstPos, 0.5).normalize().multiplyScalar(1.4),
        dstPos.clone()
    )
    const arcPts = curve.getPoints(50)
    
    const arcMat = new THREE.LineDashedMaterial({ 
        color: riskColor, 
        transparent: true, 
        opacity: 0.9, 
        linewidth: 2,
        dashSize: 0.1,
        gapSize: 0.02,
        blending: THREE.AdditiveBlending 
    })
    const arcObj = new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPts), arcMat)
    g.add(arcObj)

    // Moving Particle on Arc
    const particleGeo = new THREE.SphereGeometry(0.015, 8, 8)
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending })
    const particle = new THREE.Mesh(particleGeo, particleMat)
    g.add(particle)

    // Kaspersky style Impact Needles (Cone geometry to look sharp)
    const createNeedle = (pos, color, height) => {
        const h = height
        const geo = new THREE.ConeGeometry(0.008, h, 8)
        geo.translate(0, h/2, 0) // Shift origin to base
        const mat = new THREE.MeshBasicMaterial({ 
            color: color, 
            transparent: true, 
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.copy(pos)
        mesh.lookAt(pos.clone().multiplyScalar(2)) // Point outwards
        // Rotate cone 90 degrees around X so it points out instead of standing up
        mesh.rotateX(Math.PI / 2)
        return mesh
    }

    const sBar = createNeedle(srcPos, 0x00d4ff, 0.1) // Source is cyan needle
    const dBar = createNeedle(dstPos, riskColor, 0.25) // Dest is risk-colored taller needle
    
    // Add rings at impact points
    const ringGeo = new THREE.RingGeometry(0.01, 0.03, 32)
    const ringMat = new THREE.MeshBasicMaterial({ color: riskColor, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.position.copy(dstPos.clone().multiplyScalar(1.005))
    ring.lookAt(dstPos.clone().multiplyScalar(2))
    g.add(ring)

    g.add(sBar); g.add(dBar)
    attackGroup.current.add(g)

    activeAttacks.current.push({
      id: a.id,
      group: g,
      startTime: Date.now(),
      arcMaterial: arcMat,
      curve: curve,
      particle: particle,
      sBar: sBar, dBar: dBar
    })

  }, [attacks])

  return (
    <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" style={{ background: '#020408' }} />
  )
}

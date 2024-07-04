<script>
export default {
  data() {
    return {
      objects: [],
      numObjects: 30,
      minRadius: 20,
      maxRadius: 40,
      gravity: 0.01,
      bounceFactor: 0.8,
      staticThreshold: 0.1,
      initialVX: 15,
      airFriction: 0.005,
      lifeSecond: 30,
      touching: false,
    }
  },
  computed: {
    isActive() {
      return this.objects.length > 0
    },
  },
  mounted() {
    this.startAnimation()

    window.addEventListener('click', () => {
      if (this.isActive)
        this.addObject()
    })
    window.addEventListener('mousemove', this.updatePointerObject)
    window.addEventListener('touchstart', this.iniPointerObject)
    window.addEventListener('touchmove', this.updatePointerObject)
    window.addEventListener('touchend', this.deiniPointerObject)

    // Event trigger
    window.addEventListener('fallings', () => {
      this.generateObjects()
    })
  },
  methods: {
    startAnimation() {
      this.preparePointerObject()
      requestAnimationFrame(this.animate)
    },
    animate() {
      this.updateObjects()
      this.checkCollision()
      requestAnimationFrame(this.animate)
    },
    preparePointerObject() {
      this.pointerObject = {
        x: -1000,
        y: -1000,
        vx: 0,
        vy: 0,
        r: this.minRadius,
      }
    },
    addObject() {
      const object = {
        x: Math.random() * window.innerWidth,
        y: -(this.maxRadius + Math.random() * window.innerHeight),
        vx: (Math.random() - 0.5) * this.initialVX,
        vy: 0,
        r: this.minRadius + Math.random() * (this.maxRadius - this.minRadius),
        theta: 0,
        alive: true,
      }
      setTimeout(() => {
        object.alive = false
      }, this.lifeSecond * 1000)
      this.objects.push(object)
    },
    generateObjects() {
      for (let i = 0; i < this.numObjects; i++)
        this.addObject()
    },
    updateObjects() {
      for (let i = 0; i < this.objects.length; i++) {
        const object = this.objects[i]
        object.x += object.vx
        object.y += object.vy
        object.vy += this.gravity
        object.vx *= 1 - this.airFriction
        object.theta += object.vx / object.r
        // clean up the dead objects
        if (!object.alive && object.y > window.innerHeight + object.r)
          this.objects.splice(i--, 1)
      }
    },
    checkCollision() {
      for (let i = 0; i < this.objects.length; i++) {
        const objectA = this.objects[i]

        // Check collision with pointer object
        const objectC = this.pointerObject
        const distanceX = objectC.x - objectA.x
        const distanceY = objectC.y - objectA.y
        const centerDistance = objectA.r + objectC.r
        if (distanceX ** 2 + distanceY ** 2 < centerDistance ** 2) {
          const angle = Math.atan2(distanceY, distanceX)
          const diffDistance = centerDistance - Math.sqrt(distanceX ** 2 + distanceY ** 2)

          objectA.x -= diffDistance * Math.cos(angle)
          objectA.y -= diffDistance * Math.sin(angle)

          const vA = Math.sqrt(objectA.vx ** 2 + objectA.vy ** 2)
          const vC = Math.sqrt(objectC.vx ** 2 + objectC.vy ** 2)
          const directionA = Math.atan2(objectA.vy, objectA.vx)
          const directionC = Math.atan2(objectC.vy, objectC.vx)

          const vAX = vA * Math.cos(directionA - angle)
          const vAY = vA * Math.sin(directionA - angle)
          const vCX = vC * Math.cos(directionC - angle)

          const finalVAX = (-vAX + 0.75 * vCX) * this.bounceFactor
          const finalVAY = vAY

          objectA.vx = Math.cos(angle) * finalVAX + Math.cos(angle + Math.PI / 2) * finalVAY
          objectA.vy = Math.sin(angle) * finalVAX + Math.sin(angle + Math.PI / 2) * finalVAY
        }

        // Check collision with other objects
        for (let j = i + 1; j < this.objects.length; j++) {
          const objectB = this.objects[j]
          const distanceX = objectB.x - objectA.x
          const distanceY = objectB.y - objectA.y
          const centerDistance = objectA.r + objectB.r
          if (distanceX ** 2 + distanceY ** 2 < centerDistance ** 2) {
            const angle = Math.atan2(distanceY, distanceX)
            const diffDistance = centerDistance - Math.sqrt(distanceX ** 2 + distanceY ** 2)

            objectA.x -= diffDistance * Math.cos(angle)
            objectA.y -= diffDistance * Math.sin(angle)
            objectB.x += diffDistance * Math.cos(angle)
            objectB.y += diffDistance * Math.sin(angle)

            const vA = Math.sqrt(objectA.vx ** 2 + objectA.vy ** 2)
            const vB = Math.sqrt(objectB.vx ** 2 + objectB.vy ** 2)
            const directionA = Math.atan2(objectA.vy, objectA.vx)
            const directionB = Math.atan2(objectB.vy, objectB.vx)

            const vAX = vA * Math.cos(directionA - angle)
            const vAY = vA * Math.sin(directionA - angle)
            const vBX = vB * Math.cos(directionB - angle)
            const vBY = vB * Math.sin(directionB - angle)

            const mA = objectA.r ** 2
            const mB = objectB.r ** 2

            const finalVAX = ((vAX * (mA - mB) + 2 * mB * vBX) / (mA + mB)) * this.bounceFactor
            const finalVBX = ((vBX * (mB - mA) + 2 * mA * vAX) / (mA + mB)) * this.bounceFactor
            const finalVAY = vAY
            const finalVBY = vBY

            objectA.vx = Math.cos(angle) * finalVAX + Math.cos(angle + Math.PI / 2) * finalVAY
            objectA.vy = Math.sin(angle) * finalVAX + Math.sin(angle + Math.PI / 2) * finalVAY
            objectB.vx = Math.cos(angle) * finalVBX + Math.cos(angle + Math.PI / 2) * finalVBY
            objectB.vy = Math.sin(angle) * finalVBX + Math.sin(angle + Math.PI / 2) * finalVBY
          }
        }

        // Check collision with the walls
        if (objectA.x + objectA.r >= window.innerWidth) {
          objectA.x = window.innerWidth - objectA.r
          objectA.vx *= -this.bounceFactor
        }
        else if (objectA.x - objectA.r <= 0) {
          objectA.x = objectA.r
          objectA.vx *= -this.bounceFactor
        }

        // Check collision with the ground (if alive)
        if (objectA.alive && objectA.y + objectA.r >= window.innerHeight) {
          objectA.y = window.innerHeight - objectA.r
          objectA.vy *= -this.bounceFactor

          // static check
          if (Math.abs(objectA.vy) < this.staticThreshold)
            objectA.vy = 0
        }
      }
    },
    updatePointerObject(event) {
      // a special case, triggered by touch event
      if (this.touching && this.pointerObject.x === -1000)
        return

      let eventX, eventY
      if (event.type === 'mousemove') {
        eventX = event.clientX
        eventY = event.clientY
      }
      else {
        eventX = event.targetTouches[0].clientX
        eventY = event.targetTouches[0].clientY
      }
      if (this.pointerObject.x !== -1000) {
        this.pointerObject.vx = eventX - this.pointerObject.x
        this.pointerObject.vy = eventY - this.pointerObject.y
      }
      this.pointerObject.x = eventX
      this.pointerObject.y = eventY
    },
    iniPointerObject(event) {
      this.pointerObject.x = event.targetTouches[0].clientX
      this.pointerObject.y = event.targetTouches[0].clientY
      this.pointerObject.vx = 0
      this.pointerObject.vy = 0
      this.touching = true
    },
    deiniPointerObject() {
      this.pointerObject.x = -1000
      this.pointerObject.y = -1000
      this.pointerObject.vx = 0
      this.pointerObject.vy = 0
    },
  },
}
</script>

<template>
  <div class="falling-container" :class="{ 'falling-active': isActive }">
    <div
      v-for="(object, index) in objects" :key="index" class="falling-object" :style="{
        width: `${object.r * 2}px`,
        height: `${object.r * 2}px`,
        transform: `translate(${object.x - object.r}px, ${object.y - object.r}px) rotate(${object.theta}rad)`,
      }"
    />
  </div>
  <div class="falling-object" style="visibility: none;" />
</template>

<style scoped>
.falling-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1000;
  pointer-events: none;
  transition: background-color 1.5s ease-in-out;
}

.falling-container.falling-active {
  background-color: rgba(208, 199, 187, 0.2);
}

.falling-object {
  position: absolute;
  border-radius: 50%;
  background-image: url('@/assets/falling.png');
  background-size: cover;
}
</style>

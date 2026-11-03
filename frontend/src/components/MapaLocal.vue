<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  editavel: { type: Boolean, default: false }
})
const emit = defineEmits(['escolher'])

const el = ref(null)
let mapa = null
let marcador = null

const temPonto = () => typeof props.lat === 'number' && typeof props.lng === 'number'

function atualizarMarcador() {
  if (!mapa) return

  if (!temPonto()) {
    if (marcador) {
      marcador.remove()
      marcador = null
    }
    return
  }

  const pos = [props.lat, props.lng]

  if (marcador) {
    marcador.setLatLng(pos)
  } else {
    marcador = L.circleMarker(pos, {
      radius: 10,
      color: '#05636d',
      weight: 2,
      fillColor: '#087e8b',
      fillOpacity: 0.85
    }).addTo(mapa)
  }

  mapa.setView(pos, Math.max(mapa.getZoom(), 8))
}

onMounted(() => {
  mapa = L.map(el.value, { scrollWheelZoom: false })

  if (temPonto()) {
    mapa.setView([props.lat, props.lng], 9)
  } else {
    mapa.setView([-15, -47], 3)
  }

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; Colaboradores do <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(mapa)

  if (props.editavel) {
    mapa.on('click', (e) => {
      const p = e.latlng.wrap()
      emit('escolher', {
        lat: Number(p.lat.toFixed(5)),
        lng: Number(p.lng.toFixed(5))
      })
    })
  }

  atualizarMarcador()
  setTimeout(() => mapa && mapa.invalidateSize(), 100)
})

watch(() => [props.lat, props.lng], atualizarMarcador)

onBeforeUnmount(() => {
  if (mapa) {
    mapa.remove()
    mapa = null
  }
})
</script>

<template>
  <div ref="el" class="mapa"></div>
</template>
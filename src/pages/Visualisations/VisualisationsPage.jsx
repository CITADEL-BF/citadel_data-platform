import { VisualisationsProvider } from '../../app/visualisations/VisualisationsContext'
import VisualisationsLayout from '../../layouts/VisualisationsLayout'

export default function VisualisationsPage() {
  return (
    <VisualisationsProvider>
      <VisualisationsLayout />
    </VisualisationsProvider>
  )
}

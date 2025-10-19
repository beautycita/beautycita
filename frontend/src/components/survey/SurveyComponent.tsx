import { useEffect, useState } from 'react'
import { Model } from 'survey-core'
import { Survey } from 'survey-react-ui'
import 'survey-core/survey-core.min.css'
import '../../styles/survey-custom.css'
import { beautycitaTheme } from '../../config/stylistOnboardingSurvey'

interface SurveyComponentProps {
  surveyJson: any
  onComplete: (survey: Model) => void
  initialData?: any
  theme?: any
  onValueChanged?: (survey: Model) => void
  onCurrentPageChanged?: (survey: Model) => void
}

export default function SurveyComponent({
  surveyJson,
  onComplete,
  initialData,
  theme = beautycitaTheme,
  onValueChanged,
  onCurrentPageChanged
}: SurveyComponentProps) {
  const [survey, setSurvey] = useState<Model | null>(null)

  useEffect(() => {
    // Create survey model
    const surveyModel = new Model(surveyJson)

    // Apply theme
    if (theme) {
      surveyModel.applyTheme(theme)
    }

    // Set initial data if provided
    if (initialData) {
      surveyModel.data = initialData
    }

    // Event handlers
    surveyModel.onComplete.add((sender) => {
      onComplete(sender)
    })

    if (onValueChanged) {
      surveyModel.onValueChanged.add((sender) => {
        onValueChanged(sender)
      })
    }

    if (onCurrentPageChanged) {
      surveyModel.onCurrentPageChanged.add((sender) => {
        onCurrentPageChanged(sender)
      })
    }

    // Custom file upload handling
    surveyModel.onUploadFiles.add((survey, options) => {
      // Store files temporarily
      const files: File[] = []
      options.files.forEach((file: File) => {
        files.push(file)
      })

      // Set file data
      options.callback('success', files.map((file, index) => ({
        file: file,
        content: URL.createObjectURL(file)
      })))
    })

    // Custom file clearing
    surveyModel.onClearFiles.add((survey, options) => {
      options.callback('success')
    })

    // Set survey state to trigger render
    setSurvey(surveyModel)

    return () => {
      // Cleanup
      surveyModel.onComplete.clear()
      if (onValueChanged) {
        surveyModel.onValueChanged.clear()
      }
      if (onCurrentPageChanged) {
        surveyModel.onCurrentPageChanged.clear()
      }
      surveyModel.onUploadFiles.clear()
      surveyModel.onClearFiles.clear()
    }
  }, [surveyJson, initialData, theme, onComplete, onValueChanged, onCurrentPageChanged])

  if (!survey) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="survey-container">
      <Survey model={survey} />
    </div>
  )
}

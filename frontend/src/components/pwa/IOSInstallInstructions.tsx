import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, ShareIcon } from '@heroicons/react/24/outline'

interface IOSInstallInstructionsProps {
  isOpen: boolean
  onClose: () => void
}

export default function IOSInstallInstructions({ isOpen, onClose }: IOSInstallInstructionsProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-8 shadow-2xl transition-all">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-500" />
                </button>

                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🍎</span>
                  </div>
                  <Dialog.Title className="text-2xl font-bold text-gray-900 mb-2">
                    Install on iPhone/iPad
                  </Dialog.Title>
                  <p className="text-gray-600">
                    Follow these simple steps to add BeautyCita to your home screen
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 mb-1">
                        Tap the Share button
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        Look for <ShareIcon className="inline h-4 w-4" /> at the bottom (Safari) or top
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 mb-1">
                        Scroll and tap "Add to Home Screen"
                      </p>
                      <p className="text-sm text-gray-600">
                        You may need to scroll down in the share menu
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 mb-1">
                        Tap "Add" to confirm
                      </p>
                      <p className="text-sm text-gray-600">
                        BeautyCita will appear on your home screen!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-2xl p-4">
                  <p className="text-sm text-gray-700 text-center">
                    💡 <strong>Tip:</strong> Once installed, you can access BeautyCita offline and get faster load times!
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
